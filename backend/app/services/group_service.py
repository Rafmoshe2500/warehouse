from typing import List
from datetime import datetime
from bson import ObjectId

from app.db.mongodb import MongoDB
from app.schemas.group import GroupCreate, GroupUpdate
from app.core.exceptions import NotFoundException, BadRequestException


class GroupService:
    """Service for managing groups - groups have no password and are always 'user' role"""
    
    def __init__(self):
        self.collection_name = "groups"
    
    def _get_collection(self):
        return MongoDB.get_permissions_collection(self.collection_name)
    
    async def get_groups(self) -> dict:
        """Get all groups"""
        collection = self._get_collection()
        groups = []
        async for group in collection.find():
            group["id"] = str(group.pop("_id"))
            groups.append(group)
        return {"groups": groups, "total": len(groups)}
    
    async def get_group_by_id(self, group_id: str) -> dict:
        """Get group by ID"""
        collection = self._get_collection()
        group = await collection.find_one({"_id": ObjectId(group_id)})
        if not group:
            raise NotFoundException("קבוצה לא נמצאה")
        group["id"] = str(group.pop("_id"))
        return group
    
    async def get_group_by_name(self, name: str) -> dict:
        """Get group by name"""
        collection = self._get_collection()
        group = await collection.find_one({"name": name})
        if group:
            group["id"] = str(group.pop("_id"))
        return group
    
    async def create_group(
        self, 
        group_data: GroupCreate, 
        created_by: str, 
        creator_role: str,
        audit_service=None
    ) -> dict:
        """Create new group"""
        collection = self._get_collection()
        
        # Check if group name exists
        existing = await collection.find_one({"name": group_data.name})
        if existing:
            raise BadRequestException("שם קבוצה כבר קיים")
        
        group_doc = {
            "name": group_data.name,
            "role": group_data.role,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(group_doc)
        group_doc["id"] = str(result.inserted_id)
        group_doc.pop("_id", None)

        if audit_service:
            from app.schemas.audit import AuditAction
            await audit_service.log_user_action(
                action=AuditAction.GROUP_CREATE,
                actor=created_by,
                actor_role=creator_role,
                target_resource="group",
                resource_id=group_doc["id"],
                details=f"נוצרה קבוצה: {group_data.name}",
                changes=group_data.dict()
            )

        return group_doc
    
    async def update_group(
        self, 
        group_id: str, 
        update_data: GroupUpdate,
        updated_by: str,
        updater_role: str,
        audit_service=None
    ) -> dict:
        """Update group"""
        collection = self._get_collection()
        
        # Check group exists
        existing = await collection.find_one({"_id": ObjectId(group_id)})
        if not existing:
            raise NotFoundException("קבוצה לא נמצאה")
        
        update_dict = {"updated_at": datetime.utcnow()}
        changes = {}

        if update_data.name is not None:
            # Check if new name is taken
            name_exists = await collection.find_one({
                "name": update_data.name,
                "_id": {"$ne": ObjectId(group_id)}
            })
            if name_exists:
                raise BadRequestException("שם קבוצה כבר קיים")
            update_dict["name"] = update_data.name
            changes["name"] = {"old": existing.get("name"), "new": update_data.name}
        
        if update_data.role is not None:
            update_dict["role"] = update_data.role
            changes["role"] = {"old": existing.get("role"), "new": update_data.role}
            
        if update_data.is_active is not None:
            update_dict["is_active"] = update_data.is_active
            changes["is_active"] = {"old": existing.get("is_active"), "new": update_data.is_active}
        
        await collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$set": update_dict}
        )

        if audit_service and changes:
            from app.schemas.audit import AuditAction
            await audit_service.log_user_action(
                action=AuditAction.GROUP_UPDATE,
                actor=updated_by,
                actor_role=updater_role,
                target_resource="group",
                resource_id=group_id,
                details=f"עודכנה קבוצה: {existing.get('name')}",
                changes=changes
            )
        
        return await self.get_group_by_id(group_id)
    
    async def delete_group(
        self, 
        group_id: str, 
        reason: str,
        deleted_by: str,
        deleter_role: str,
        audit_service=None
    ) -> dict:
        """Delete group"""
        collection = self._get_collection()
        
        existing = await collection.find_one({"_id": ObjectId(group_id)})
        if not existing:
            raise NotFoundException("קבוצה לא נמצאה")
        
        await collection.delete_one({"_id": ObjectId(group_id)})

        if audit_service:
            from app.schemas.audit import AuditAction
            await audit_service.log_user_action(
                action=AuditAction.GROUP_DELETE,
                actor=deleted_by,
                actor_role=deleter_role,
                target_resource="group",
                resource_id=group_id,
                details=f"נמחקה קבוצה: {existing.get('name')}",
                reason=reason
            )

        return {"message": "קבוצה נמחקה בהצלחה", "reason": reason}
