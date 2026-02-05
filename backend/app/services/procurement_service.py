from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, UploadFile
import uuid
import logging

from app.db.repositories.procurement_repository import ProcurementRepository
from app.services.s3_service import S3Service
from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction
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
    
    def __init__(self):
        self.repository = ProcurementRepository()
        self.s3_service = S3Service()
        self.audit_service = AuditService()
    
    def can_edit_procurement(self, user_role: str) -> bool:
        """Check if user can edit procurement (admin or superadmin)"""
        return user_role in ["admin", "superadmin"]
    
    async def create_order(
        self,
        order_data: ProcurementOrderCreate,
        created_by: str
    ) -> dict:
        """Create new procurement order"""
        order_dict = order_data.model_dump()
        order_dict["created_by"] = created_by
        
        # Ensure default status if not set
        if "status" not in order_dict:
            order_dict["status"] = ProcurementStatus.WAITING_FOR_EMF
        
        # Business Logic Validation
        if order_dict.get("status") == ProcurementStatus.ORDERED:
            order_dict["received_emf"] = True
            order_dict["received_bom"] = True
            
        if order_dict.get("received_emf") and order_dict.get("status") == ProcurementStatus.WAITING_FOR_EMF:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="לא ניתן לבחור סטטוס 'מחכה ל-EMF' כאשר סומן שהתקבל EMF")
            
        if order_dict.get("received_bom") and order_dict.get("status") == ProcurementStatus.WAITING_FOR_BOM:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="לא ניתן לבחור סטטוס 'מחכה ל-BOM' כאשר סומן שהתקבל BOM")

        created_order = await self.repository.create_order(order_dict)
        
        # Audit Log
        try:
            await self.audit_service.log_user_action(
                action=AuditAction.PROCUREMENT_CREATE,
                actor=created_by,
                actor_role="admin",  # Assuming admin created it
                target_resource="procurement_order",
                resource_id=created_order["id"],
                changes=order_dict
            )
        except Exception as e:
            logger.error(f"Failed to log audit for create order: {e}")
            
        return created_order
    
    async def get_orders(
        self,
        page: int = 1,
        page_size: int = 50,
        catalog_number: Optional[str] = None,
        manufacturer: Optional[str] = None,
        status_in: Optional[List[str]] = None,
        status_ne: Optional[str] = None
    ) -> tuple[List[dict], int]:
        """Get all procurement orders with pagination"""
        skip = (page - 1) * page_size
        return await self.repository.get_orders(
            skip=skip,
            limit=page_size,
            catalog_number=catalog_number,
            manufacturer=manufacturer,
            status_in=status_in,
            status_ne=status_ne
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
        user_role: str,
        username: str = "unknown"
    ) -> dict:
        """Update procurement order"""
        if not self.can_edit_procurement(user_role):
            raise HTTPException(status_code=403, detail="אין לך הרשאה לערוך הזמנות")
        
        # Get existing order
        existing_order = await self.get_order_by_id(order_id)
        
        # Update only provided fields
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Prepare updated values for validation
        # We need to merge existing values with updates to check the final state
        current_status = update_dict.get("status", existing_order.get("status"))
        # Note: received_emf/bom might be booleans in update_dict or existing_order
        current_received_emf = update_dict.get("received_emf") if "received_emf" in update_dict else existing_order.get("received_emf")
        current_received_bom = update_dict.get("received_bom") if "received_bom" in update_dict else existing_order.get("received_bom")

        # Business Logic Logic
        if current_status == ProcurementStatus.ORDERED:
            update_dict["received_emf"] = True
            update_dict["received_bom"] = True
            # Update local variables for subsequent checks (though not strictly needed if we return here/continue)
            current_received_emf = True
            current_received_bom = True
            
        if current_received_emf and current_status == ProcurementStatus.WAITING_FOR_EMF:
            raise HTTPException(status_code=400, detail="לא ניתן לבחור סטטוס 'מחכה ל-EMF' כאשר סומן שהתקבל EMF")
            
        if current_received_bom and current_status == ProcurementStatus.WAITING_FOR_BOM:
            raise HTTPException(status_code=400, detail="לא ניתן לבחור סטטוס 'מחכה ל-BOM' כאשר סומן שהתקבל BOM")

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
        
        # Audit Log
        if changes:
            try:
                await self.audit_service.log_user_action(
                    action=AuditAction.PROCUREMENT_UPDATE,
                    actor=username,
                    actor_role=user_role,
                    target_resource="procurement_order",
                    resource_id=order_id,
                    changes=changes
                )
            except Exception as e:
                logger.error(f"Failed to log audit for update order: {e}")
        
        return updated_order
    
    async def delete_order(self, order_id: str, user_role: str, username: str = "unknown") -> bool:
        """Delete procurement order and all associated files"""
        if not self.can_edit_procurement(user_role):
            raise HTTPException(status_code=403, detail="אין לך הרשאה למחוק הזמנות")
        
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
        
        # Audit Log
        try:
            await self.audit_service.log_user_action(
                action=AuditAction.PROCUREMENT_DELETE,
                actor=username,
                actor_role=user_role,
                target_resource="procurement_order",
                resource_id=order_id,
                reason="Deleted by user"
            )
        except Exception as e:
            logger.error(f"Failed to log audit for delete order: {e}")
            
        return True
    
    async def upload_file(
        self,
        order_id: str,
        file: UploadFile,
        uploaded_by: str,
        user_role: str
    ) -> dict:
        """Upload file to procurement order"""
        if not self.can_edit_procurement(user_role):
            raise HTTPException(status_code=403, detail="אין לך הרשאה להעלות קבצים")
        
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
        
        # Reset file pointer for upload
        await file.seek(0)
        
        # Upload to S3 or local storage
        upload_result = await self.s3_service.upload_file(
            file_content=file.file,
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
            "uploaded_at": datetime.utcnow()
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
            await self.audit_service.log_user_action(
                action=AuditAction.PROCUREMENT_FILE_UPLOAD,
                actor=uploaded_by,
                actor_role=user_role,
                target_resource="procurement_order",
                resource_id=order_id,
                changes={"filename": file.filename}
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
    
    async def delete_file(self, order_id: str, file_id: str, user_role: str, username: str = "unknown") -> bool:
        """Delete file from procurement order"""
        if not self.can_edit_procurement(user_role):
            raise HTTPException(status_code=403, detail="אין לך הרשאה למחוק קבצים")
        
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
            await self.audit_service.log_user_action(
                action=AuditAction.PROCUREMENT_FILE_DELETE,
                actor=username,
                actor_role=user_role,
                target_resource="procurement_order",
                resource_id=order_id,
                changes={"filename": file_metadata["filename"]}
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
