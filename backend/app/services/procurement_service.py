from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, UploadFile
import uuid
import logging

from app.core.constants import UserRole
from app.db.repositories.procurement_repository import ProcurementRepository
from app.services.s3_service import S3Service
from app.services.audit.procurement_auditor import ProcurementAuditor
from app.services.bom_analytics_service import BomAnalyticsService, _resolve_datetime
from app.schemas.procurement import (
    ProcurementOrderCreate,
    ProcurementOrderUpdate,
    ProcurementFileMetadata,
    ProcurementStatus
)

logger = logging.getLogger(__name__)

# Allowed file types
ALLOWED_EXTENSIONS = {
    'pdf', 'jpg', 'jpeg', 'png', 'gif',
    'xlsx', 'xls', 'doc', 'docx', 'txt'
}

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024


class ProcurementService:
    """Service for procurement business logic"""
    
    def __init__(
        self,
        repository: ProcurementRepository,
        s3_service: S3Service,
        auditor: ProcurementAuditor,
        analytics_service: BomAnalyticsService,   # injected — satisfies DIP
    ):
        self.repository        = repository
        self.s3_service        = s3_service
        self.auditor           = auditor
        self.analytics_service = analytics_service
    
    async def create_order(
        self,
        order_data: ProcurementOrderCreate,
        created_by: str
    ) -> dict:
        """Create new procurement order"""
        logger.info(f"Starting order creation for User={created_by}")
        order_dict = order_data.model_dump()
        order_dict["created_by"] = created_by
        
        # Ensure default status if not set
        if "status" not in order_dict:
            order_dict["status"] = ProcurementStatus.WAITING_BOM_EMF
        
        # Business Logic: if both BOM and EMF received → WAITING_SHIPMENT
        if order_dict.get("status") not in [ProcurementStatus.SHIPPED, ProcurementStatus.RECEIVED]:
            has_emf = bool(order_dict.get("emf_number"))
            has_bom = order_dict.get("received_bom", False)
            if has_emf and has_bom:
                order_dict["status"] = ProcurementStatus.WAITING_SHIPMENT
            else:
                order_dict["status"] = ProcurementStatus.WAITING_BOM_EMF

        # Extract BOM file keys (not stored as order fields in DB)
        bom_s3_key  = order_dict.pop("bom_file_s3_key", None)
        bom_filename = order_dict.pop("bom_filename", None) or "bom_file.xlsx"

        # Populate initial tracking timestamps
        now = datetime.now(timezone.utc)
        if order_dict.get("received_bom"):
            order_dict["bom_received_at"] = now
        if order_dict.get("emf_number"):
            order_dict["emf_received_at"] = now
            
        status = order_dict.get("status")
        if status == ProcurementStatus.WAITING_SHIPMENT:
            order_dict["waiting_shipment_at"] = now
        elif status == ProcurementStatus.SHIPPED:
            order_dict["shipped_at"] = now
        elif status == ProcurementStatus.RECEIVED:
            order_dict["received_at"] = now

        # Strip unknown_parts from bom_data — saves significant DB space
        if order_dict.get("bom_data") and isinstance(order_dict["bom_data"], dict):
            order_dict["bom_data"].pop("unknown_parts", None)

        # Build initial files list — embed the BOM file directly on creation
        initial_files = []
        if bom_s3_key:
            initial_files.append({
                "file_id": str(uuid.uuid4()),
                "filename": bom_filename,
                "file_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "file_size": 0,
                "s3_key": bom_s3_key,
                "local_path": bom_s3_key if not bom_s3_key.startswith("s3://") else None,
                "uploaded_by": created_by,
                "uploaded_at": datetime.now(timezone.utc),
            })

        created_order = await self.repository.create_order(order_dict, initial_files=initial_files)
        
        # BOM Analytics Integration
        if created_order.get("bom_data") and created_order.get("bom_vendor"):
            try:
                raw_date = created_order.get("order_date") or created_order.get("created_at")
                await self.analytics_service.record_bom_prices(
                    order_id=str(created_order.get("id") or created_order.get("_id", uuid.uuid4())),
                    recorded_at=_resolve_datetime(raw_date),
                    vendor=created_order["bom_vendor"],
                    bom_groups=created_order["bom_data"].get("groups", [])
                )
            except Exception as e:
                logger.error("Failed to record BOM prices for analytics: %s", e)
        elif created_order.get("bom_items"):
            # Manual order (no BOM file) — record product names so they appear in search
            try:
                raw_date = created_order.get("order_date") or created_order.get("created_at")
                vendor = (created_order.get("bom_items") or [{}])[0].get("manufacturer", "")
                await self.analytics_service.record_manual_prices(
                    order_id=str(created_order.get("id") or created_order.get("_id", uuid.uuid4())),
                    recorded_at=_resolve_datetime(raw_date),
                    vendor=vendor,
                    bom_items=created_order["bom_items"],
                )
            except Exception as e:
                logger.error("Failed to record manual prices for analytics: %s", e)
        
        # Audit Log
        try:
            await self.auditor.log_create_order(
                username=created_by,
                order_id=str(created_order["id"]),
                order_data=order_dict
            )
        except Exception as e:
            logger.error(f"Failed to log audit for create order: {e}")
            
        logger.info(f"Order created successfully: {created_order.get('id')}")
        return created_order
    
    async def get_orders(
        self,
        page: int = 1,
        page_size: int = 50,
        search: Optional[str] = None,
        catalog_number: Optional[str] = None,
        manufacturer: Optional[str] = None,
        emf_number: Optional[str] = None,
        status_in: Optional[List[str]] = None,
        status_ne: Optional[str] = None,
        allowed_vendors: Optional[List[str]] = None
    ) -> tuple[List[dict], int]:
        """Get all procurement orders with pagination"""
        skip = (page - 1) * page_size
        return await self.repository.get_orders(
            skip=skip,
            limit=page_size,
            search=search,
            catalog_number=catalog_number,
            manufacturer=manufacturer,
            emf_number=emf_number,
            status_in=status_in,
            status_ne=status_ne,
            allowed_vendors=allowed_vendors
        )
    
    async def get_order_by_id(self, order_id: str) -> dict:
        """Get procurement order by ID"""
        order = await self.repository.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
        return order
    
    async def update_order(
        self,
        order_id: str,
        update_data: ProcurementOrderUpdate,
        username: str = "unknown"
    ) -> dict:
        """Update procurement order"""
        logger.info(f"Updating order {order_id} by User={username}")
        # Get existing order
        existing_order = await self.get_order_by_id(order_id)
        
        # Update only provided fields
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Prepare updated values for validation
        # We need to merge existing values with updates to check the final state
        current_status = update_dict.get("status", existing_order.get("status"))
        # Note: received_bom might be boolean in update_dict or existing_order
        current_received_bom = update_dict.get("received_bom") if "received_bom" in update_dict else existing_order.get("received_bom")
        current_emf = update_dict.get("emf_number") if "emf_number" in update_dict else existing_order.get("emf_number")

        # Business Logic
        # Status auto-update: both BOM+EMF → WAITING_SHIPMENT, otherwise WAITING_BOM_EMF
        if current_status not in [ProcurementStatus.SHIPPED, ProcurementStatus.RECEIVED]:
            has_emf = bool(current_emf)
            has_bom = current_received_bom
            if has_emf and has_bom:
                update_dict["status"] = ProcurementStatus.WAITING_SHIPMENT
            else:
                update_dict["status"] = ProcurementStatus.WAITING_BOM_EMF

        # Populate tracking timestamps for transitions
        now = datetime.now(timezone.utc)
        
        # BOM received transition
        if "received_bom" in update_dict:
            if update_dict["received_bom"] and not existing_order.get("received_bom"):
                update_dict["bom_received_at"] = now
            elif not update_dict["received_bom"]:
                update_dict["bom_received_at"] = None
                
        # EMF received transition
        if "emf_number" in update_dict:
            if update_dict["emf_number"] and not existing_order.get("emf_number"):
                update_dict["emf_received_at"] = now
            elif not update_dict["emf_number"]:
                update_dict["emf_received_at"] = None

        # Status transitions
        if "status" in update_dict and update_dict["status"] != existing_order.get("status"):
            new_status = update_dict["status"]
            if new_status == ProcurementStatus.WAITING_SHIPMENT and not existing_order.get("waiting_shipment_at"):
                update_dict["waiting_shipment_at"] = now
            elif new_status == ProcurementStatus.SHIPPED and not existing_order.get("shipped_at"):
                update_dict["shipped_at"] = now
            elif new_status == ProcurementStatus.RECEIVED and not existing_order.get("received_at"):
                update_dict["received_at"] = now

        # Calculate changes for audit
        changes = {}
        for key, value in update_dict.items():
            old_val = existing_order.get(key)
            # Handle Enum serialization
            new_val = value.value if hasattr(value, 'value') else value
            # Handle Date serialization
            if isinstance(old_val, datetime):
                old_val = old_val.isoformat()
            if isinstance(new_val, datetime):
                new_val = new_val.isoformat()
                
            if old_val != new_val:
                changes[key] = {"old": old_val, "new": new_val}
        
        updated_order = await self.repository.update_order(order_id, update_dict)
        if not updated_order:
            raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
            
        # BOM Analytics Integration
        if updated_order.get("bom_data") and updated_order.get("bom_vendor") and "bom_data" in update_dict:
            try:
                raw_date = updated_order.get("order_date") or updated_order.get("created_at")
                await self.analytics_service.record_bom_prices(
                    order_id=str(order_id),
                    recorded_at=_resolve_datetime(raw_date),
                    vendor=updated_order["bom_vendor"],
                    bom_groups=updated_order["bom_data"].get("groups", [])
                )
            except Exception as e:
                logger.error("Failed to update BOM prices for analytics: %s", e)
        elif updated_order.get("bom_items") and "bom_items" in update_dict:
            # Manual order updated — re-record manual placeholders
            try:
                raw_date = updated_order.get("order_date") or updated_order.get("created_at")
                vendor = (updated_order.get("bom_items") or [{}])[0].get("manufacturer", "")
                await self.analytics_service.record_manual_prices(
                    order_id=str(order_id),
                    recorded_at=_resolve_datetime(raw_date),
                    vendor=vendor,
                    bom_items=updated_order["bom_items"],
                )
            except Exception as e:
                logger.error("Failed to update manual prices for analytics: %s", e)
        
        # Audit Log
        if changes:
            try:
                await self.auditor.log_update_order(
                    username=username,
                    order_id=order_id,
                    changes=changes
                )
            except Exception as e:
                logger.error(f"Failed to log audit for update order: {e}")
        
        return updated_order
    
    async def delete_order(self, order_id: str, username: str = "unknown") -> bool:
        """Delete procurement order and all associated files"""
        logger.info(f"Deleting order {order_id} by User={username}")
        
        # Get order to delete files
        order = await self.get_order_by_id(order_id)
        
        # Delete all files
        for file in order.get("files", []):
            await self.s3_service.delete_file(
                s3_key=file.get("s3_key"),
                local_path=file.get("local_path")
            )
        
        # Delete order
        success = await self.repository.delete_order(order_id)
        if not success:
            raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
        
        # Delete all existing audit logs for this order
        try:
            await self.auditor.delete_all_order_logs(order_id=order_id)
        except Exception as e:
            logger.error(f"Failed to delete audit logs for deleted order {order_id}: {e}")

        # Delete analytics price history for this order
        try:
            await self.analytics_service.delete_order_history(order_id)
        except Exception as e:
            logger.error("Failed to delete analytics history for order %s: %s", order_id, e)
            
        return True
    
    async def upload_file(
        self,
        order_id: str,
        file: UploadFile,
        uploaded_by: str
    ) -> dict:
        """Upload file to procurement order"""
        
        # Validate order exists
        await self.get_order_by_id(order_id)
        
        # Validate file
        self._validate_file(file)
        
        # Read file content
        file_content = await file.read()
        
        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"גודל הקובץ חורג מהמקסימום המותר ({MAX_FILE_SIZE / 1024 / 1024}MB)"
            )
        
        # Upload to S3 or local storage
        upload_result = await self.s3_service.upload_file(
            file_content=file_content,
            filename=file.filename,
            content_type=file.content_type or 'application/octet-stream'
        )
        
        # Create file metadata
        file_metadata = {
            "file_id": upload_result["file_id"],
            "filename": file.filename,
            "file_type": file.content_type or 'application/octet-stream',
            "file_size": len(file_content),
            "s3_key": upload_result.get("s3_key"),
            "local_path": upload_result.get("local_path"),
            "uploaded_by": uploaded_by,
            "uploaded_at": datetime.now(timezone.utc)
        }
        
        # Add to order
        updated_order = await self.repository.add_file_to_order(order_id, file_metadata)
        if not updated_order:
            # Cleanup uploaded file
            await self.s3_service.delete_file(
                s3_key=upload_result.get("s3_key"),
                local_path=upload_result.get("local_path")
            )
            raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
        
        # Audit Log
        try:
            await self.auditor.log_upload_file(
                username=uploaded_by,
                order_id=order_id,
                filename=file.filename
            )
        except Exception as e:
            logger.error(f"Failed to log audit for file upload: {e}")
            
        return {
            "file_id": file_metadata["file_id"],
            "filename": file_metadata["filename"],
            "message": "הקובץ הועלה בהצלחה"
        }
    
    async def download_file(self, order_id: str, file_id: str) -> tuple[bytes, str, str]:
        """Download file from procurement order"""
        # Get file metadata
        file_metadata = await self.repository.get_file_metadata(order_id, file_id)
        if not file_metadata:
            raise HTTPException(status_code=404, detail="קובץ לא נמצא")
        
        # Download file
        file_content = await self.s3_service.download_file(
            s3_key=file_metadata.get("s3_key"),
            local_path=file_metadata.get("local_path")
        )
        
        if not file_content:
            raise HTTPException(status_code=404, detail="לא ניתן להוריד את הקובץ")
        
        return file_content, file_metadata["filename"], file_metadata["file_type"]
    
    async def delete_file(self, order_id: str, file_id: str, username: str = "unknown") -> bool:
        """Delete file from procurement order"""
        
        # Get file metadata
        file_metadata = await self.repository.get_file_metadata(order_id, file_id)
        if not file_metadata:
            raise HTTPException(status_code=404, detail="קובץ לא נמצא")
        
        # Delete from storage
        await self.s3_service.delete_file(
            s3_key=file_metadata.get("s3_key"),
            local_path=file_metadata.get("local_path")
        )
        
        # Remove from order
        updated_order = await self.repository.remove_file_from_order(order_id, file_id)
        if not updated_order:
            raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
        
        # Audit Log
        try:
            await self.auditor.log_delete_file(
                username=username,
                order_id=order_id,
                filename=file_metadata["filename"]
            )
        except Exception as e:
            logger.error(f"Failed to log audit for file delete: {e}")
            
        return True
    
    def _validate_file(self, file: UploadFile):
        """Validate file type"""
        if not file.filename:
            raise HTTPException(status_code=400, detail="שם קובץ חסר")
        
        # Check file extension
        file_ext = file.filename.split('.')[-1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"סוג קובץ לא נתמך. סוגים מותרים: {', '.join(ALLOWED_EXTENSIONS)}"
            )
