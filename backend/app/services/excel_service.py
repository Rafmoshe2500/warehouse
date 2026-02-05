from typing import List, Dict, Any, Optional
from datetime import datetime

import pandas as pd
from fastapi import UploadFile
import io

from app.db.repositories.items import ItemsRepository
from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction
from app.core.exceptions import ExcelFileException
from app.core.excel_parser import ExcelParser
from app.schemas.item import ItemFilter


class ExcelService:
    def __init__(self, items_repo: ItemsRepository, audit_service: AuditService):
        self.items_repo = items_repo
        self.audit_service = audit_service

    async def import_excel(self, file: UploadFile, user: str):
        """
        יבוא מלאי ראשי
        """
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise ExcelFileException("פורמט קובץ לא נתמך")

        contents = await file.read()
        try:
            records = ExcelParser.parse_inventory(contents)
        except Exception as e:
            raise ExcelFileException(f"שגיאה בקריאת הקובץ: {str(e)}")

        if not records:
            raise ExcelFileException("הקובץ ריק")

        # Start Business Logic Processing
        return await self._execute_import_logic(records, user)

    async def _execute_import_logic(self, records: List[Dict], user: str):
        added_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        # שדות שבודקים ומעדכנים כאשר יש סריאלי (לא כולל הערות ויעוד!)
        serial_update_fields = [
            'catalog_number', 'description', 'manufacturer',
            'location', 'current_stock', 'warranty_expiry'
        ]

        for index, record in enumerate(records, start=1):
            try:
                has_serial = bool(record.get('serial') and record['serial'].strip())

                # --- תרחיש 1: יש סריאלי ---
                if has_serial:
                    existing_item = await self.items_repo.find_by_serial(record['serial'])

                    if existing_item:
                        # הפריט קיים -> בדיקה אם משהו השתנה (חוץ מהערות ויעוד)
                        if self.has_changes(existing_item, record, serial_update_fields):
                            # יש שינוי -> מעדכנים
                            changes = self.get_changes(existing_item, record, serial_update_fields)

                            # בונים את המידע לעדכון (רק השדות המותרים)
                            update_data = {k: self.normalize_value(record[k]) for k in serial_update_fields if k in record}
                            update_data['updated_at'] = datetime.utcnow()

                            await self.items_repo.update(str(existing_item["_id"]), update_data)
                            updated_count += 1

                            await self.audit_service.log_user_action(
                                action=AuditAction.ITEM_UPDATE,
                                actor=user,
                                actor_role="unknown", # Assuming user ID passed
                                target_resource="item",
                                resource_id=str(existing_item["_id"]),
                                changes=changes,
                                details="עדכון מאקסל (ללא הערות/יעוד)"
                            )
                        else:
                            # הכל זהה -> רק מעדכנים זמן עדכון (למניעת סטטוס stale)
                            await self.items_repo.update(str(existing_item["_id"]), {"updated_at": datetime.utcnow()})
                            skipped_count += 1
                    else:
                        # יש סריאלי אבל הוא לא קיים במערכת -> יוצרים חדש
                        record["created_at"] = datetime.utcnow()
                        record["updated_at"] = datetime.utcnow()
                        created_item = await self.items_repo.create(record)
                        added_count += 1

                        await self.audit_service.log_user_action(
                            action=AuditAction.ITEM_CREATE,
                            actor=user,
                            actor_role="unknown",
                            target_resource="item",
                            resource_id=str(created_item["id"]),
                            changes=record,
                            details="נוסף מאקסל (לפי סריאלי)"
                        )

                # --- תרחיש 2: אין סריאלי ---
                else:
                    catalog_number = record.get('catalog_number', '').strip()
                    location = record.get('location', '').strip()

                    if not catalog_number:
                        # שורה בלי סריאלי ובלי מק"ט - מדלגים או שגיאה
                        errors.append(f"שורה {index}: חסר מזהה (סריאלי או מק\"ט)")
                        continue

                    # מחפשים לפי מק"ט + מיקום
                    existing_item = await self.items_repo.find_by_catalog_and_location(catalog_number, location)

                    if existing_item:
                        # קיים באותו מיקום -> מעדכנים רק כמות
                        new_stock = self.normalize_value(record.get('current_stock', ''))
                        old_stock = self.normalize_value(existing_item.get('current_stock', ''))

                        if new_stock != old_stock:
                            update_data = {
                                'current_stock': new_stock,
                                'updated_at': datetime.utcnow()
                            }
                            await self.items_repo.update(str(existing_item["_id"]), update_data)
                            updated_count += 1

                            await self.audit_service.log_user_action(
                                action=AuditAction.ITEM_UPDATE,
                                actor=user,
                                actor_role="unknown",
                                target_resource="item",
                                resource_id=str(existing_item["_id"]),
                                changes={'current_stock': {'old': old_stock, 'new': new_stock}},
                                details=f"עדכון כמות במיקום {location}"
                            )
                        else:
                            await self.items_repo.update(str(existing_item["_id"]), {"updated_at": datetime.utcnow()})
                            skipped_count += 1
                    else:
                        # מיקום שונה או מק"ט לא קיים -> יוצרים חדש
                        record["created_at"] = datetime.utcnow()
                        record["updated_at"] = datetime.utcnow()
                        created_item = await self.items_repo.create(record)
                        added_count += 1

                        await self.audit_service.log_user_action(
                            action=AuditAction.ITEM_CREATE,
                            actor=user,
                            actor_role="unknown",
                            target_resource="item",
                            resource_id=str(created_item["id"]),
                            changes=record,
                            details=f"נוסף מאקסל (מק\"ט במיקום {location})"
                        )

            except Exception as e:
                errors.append(f"שורה {index}: {str(e)}")
                continue

        # לוג סיכום
        if added_count > 0 or updated_count > 0:
            await self.audit_service.log_user_action(
                action=AuditAction.ITEM_IMPORT,
                actor=user,
                actor_role="unknown",
                target_resource="item",
                resource_id="BULK_IMPORT",
                details=f"יבוא מאקסל: {added_count} נוספו, {updated_count} עודכנו",
                changes={"total_rows": len(records), "added": added_count, "updated": updated_count}
            )

        return {
            "message": "יבוא הושלם בהצלחה",
            "added": added_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total_processed": len(records),
            "errors": errors
        }

    async def export_excel(
            self,
            search: Optional[str] = None,
            catalog_number: Optional[str] = None,
            serial: Optional[str] = None,
            manufacturer: Optional[str] = None,
            description: Optional[str] = None,
            location: Optional[str] = None,
            current_stock: Optional[str] = None,
            purpose: Optional[str] = None,
            notes: Optional[str] = None,
            page: int = 1,
            limit: int = 100000
    ) -> io.BytesIO:
        """ייצוא לאקסל עם תמיכה מלאה בפילטרים ופג'ינציה"""

        filter_params = ItemFilter(
            search=search,
            catalog_number=catalog_number,
            serial=serial,
            manufacturer=manufacturer,
            description=description,
            location=location,
            current_stock=current_stock,
            purpose=purpose,
            notes=notes,
            page=page,
            limit=limit,
            sort_by="updated_at",
            sort_order="desc"
        )

        items, _ = await self.items_repo.search(filter_params)

        if not items:
            raise ExcelFileException("לא נמצאו פריטים לייצוא לפי הסינון המבוקש")

        clean_items = []
        for item in items:
            # Create a copy to minimize side effects on cached objects if any
            clean_item = item.copy()
            clean_items.append(clean_item)

        # Delegate generation to Parser
        return ExcelParser.generate_inventory_excel(clean_items)

    async def import_project_excel(self, file: UploadFile, user: str):
        """
        יבוא קובץ הקצאות
        """
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise ExcelFileException("פורמט קובץ לא נתמך")

        contents = await file.read()
        try:
            raw_records = ExcelParser.parse_project_allocation(contents)
        except Exception as e:
            raise ExcelFileException(f"שגיאה בקריאת הקובץ: {str(e)}")
        
        # Logic for aggregation
        grouped_data = {}

        for row in raw_records:
            cat = str(row['catalog_number']).strip()
            loc = str(row['location']).strip()
            proj = str(row['project']).strip()
            
            try:
                qty = float(row['quantity'])
                if qty.is_integer():
                    qty = int(qty)
            except (ValueError, TypeError):
                continue 

            if not cat or not proj:
                continue

            key = (cat, loc)
            if key not in grouped_data:
                grouped_data[key] = {}
            
            if proj in grouped_data[key]:
                grouped_data[key][proj] += qty
            else:
                grouped_data[key][proj] = qty

        updated_count = 0
        
        for (cat, loc), projects in grouped_data.items():
            lines = []
            for proj, qty in projects.items():
                lines.append(f"{qty} - {proj}")
            reserved_value_str = "\n".join(lines)

            # Update ALL items with this catalog and location
            modified_count = await self.items_repo.update_allocations_by_location(
                cat, loc, projects, reserved_value_str
            )
            
            if modified_count > 0:
                updated_count += modified_count
                
                # Log the action (generic log for the group)
                await self.audit_service.log_user_action(
                    action=AuditAction.ITEM_UPDATE,
                    actor=user,
                    actor_role="unknown",
                    target_resource="item",
                    resource_id=cat,
                    details=f"עדכון הקצאות (קבוצתי) במיקום {loc}: {reserved_value_str.replace(chr(10), ', ')}",
                    changes={"reserved_stock": reserved_value_str, "modified_count": modified_count}
                )

        return {
            "message": f"העדכון הושלם. עודכנו {updated_count} פריטים.",
            "updated": updated_count,
            "total_groups": len(grouped_data)
        }

    # --- Helpers ---

    @staticmethod
    def normalize_value(value: Any) -> str:
        if value is None or pd.isna(value) or str(value).lower() == 'nan':
            return ''
        return str(value).strip()

    @staticmethod
    def has_changes(existing_item: Dict, new_item: Dict, fields: List[str]) -> bool:
        for field in fields:
            if field not in new_item:
                continue
            existing_value = ExcelService.normalize_value(existing_item.get(field, ''))
            new_value = ExcelService.normalize_value(new_item.get(field, ''))
            if existing_value != new_value:
                return True
        return False

    @staticmethod
    def get_changes(existing_item: Dict, new_item: Dict, fields: List[str]) -> Dict:
        changes = {}
        for field in fields:
            if field not in new_item:
                continue
            existing_value = ExcelService.normalize_value(existing_item.get(field, ''))
            new_value = ExcelService.normalize_value(new_item.get(field, ''))
            if existing_value != new_value:
                changes[field] = {'old': existing_value, 'new': new_value}
        return changes