from typing import List, Optional
from datetime import datetime, timezone

from app.db.repositories.group_repository import GroupRepository
from app.services.audit.group_auditor import GroupAuditor
from app.schemas.group import GroupCreate, GroupUpdate
from app.core.exceptions import NotFoundException, BadRequestException


class GroupService:
    """Service for managing groups - groups have no password and are always 'user' role"""
    
    def __init__(self, repo: GroupRepository, auditor: GroupAuditor):
        self.repo = repo
        self.auditor = auditor
    
    async def get_groups(self) -> dict:
        """Get all groups"""
        groups = await self.repo.list_groups()
        return {"groups": groups, "total": len(groups)}
    
    async def get_group_by_id(self, group_id: str) -> dict:
        """Get group by ID"""
        group = await self.repo.get_by_id(group_id)
        if not group:
            raise NotFoundException("קבוצה לא נמצאה")
        return group
    
    async def get_group_by_name(self, name: str) -> Optional[dict]:
        """Get group by name"""
        return await self.repo.get_by_name(name)
    
    async def create_group(
        self, 
        group_data: GroupCreate, 
        created_by: str, 
        creator_role: str,
        # audit_service is removed in flavor of self.auditor
    ) -> dict:
        """Create new group"""
        
        # Check if group name exists
        existing = await self.repo.get_by_name(group_data.name)
        if existing:
            raise BadRequestException("שם קבוצה כבר קיים")
        
        group_doc = {
            "name": group_data.name,
            "role": group_data.role,
            "permissions": group_data.permissions or [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        created_group = await self.repo.create(group_doc)
        
        # Audit log
        try:
            await self.auditor.log_create_group(
                actor=created_by,
                actor_role=creator_role,
                group_id=created_group["id"],
                group_name=created_group["name"],
                changes=group_data.model_dump()
            )
        except Exception as e:
            # We don't want to fail request if audit logging fails
            # But in production we should log this error
            pass

        return created_group
    
    async def update_group(
        self, 
        group_id: str, 
        update_data: GroupUpdate,
        updated_by: str,
        updater_role: str
    ) -> dict:
        """Update group"""
        # Check group exists
        existing = await self.repo.get_by_id(group_id)
        if not existing:
            raise NotFoundException("קבוצה לא נמצאה")
        
        update_dict = {"updated_at": datetime.now(timezone.utc)}
        changes = {}

        if update_data.name is not None:
            # Check if new name is taken
            name_exists = await self.repo.get_by_name(update_data.name)
            if name_exists and name_exists["id"] != group_id:
                raise BadRequestException("שם קבוצה כבר קיים")
            update_dict["name"] = update_data.name
            changes["name"] = {"old": existing.get("name"), "new": update_data.name}
        
        if update_data.role is not None:
            update_dict["role"] = update_data.role
            changes["role"] = {"old": existing.get("role"), "new": update_data.role}
            
        if update_data.permissions is not None:
            update_dict["permissions"] = update_data.permissions
            changes["permissions"] = {"old": existing.get("permissions", []), "new": update_data.permissions}
            
        if update_data.is_active is not None:
            update_dict["is_active"] = update_data.is_active
            changes["is_active"] = {"old": existing.get("is_active"), "new": update_data.is_active}
        
        await self.repo.update(group_id, update_dict)

        # Audit log
        if changes:
            try:
                await self.auditor.log_update_group(
                    actor=updated_by,
                    actor_role=updater_role,
                    group_id=group_id,
                    group_name=existing.get("name"),  # Use old name in log details? Or new? details uses name.
                    changes=changes
                )
            except Exception:
                pass
        
        return await self.get_group_by_id(group_id)
    
    async def delete_group(
        self, 
        group_id: str, 
        reason: str,
        deleted_by: str,
        deleter_role: str
    ) -> dict:
        """Delete group"""
        existing = await self.repo.get_by_id(group_id)
        if not existing:
            raise NotFoundException("קבוצה לא נמצאה")
        
        await self.repo.delete(group_id)

        try:
            await self.auditor.log_delete_group(
                actor=deleted_by,
                actor_role=deleter_role,
                group_id=group_id,
                group_name=existing.get("name"),
                reason=reason
            )
        except Exception:
            pass

        return {"message": "קבוצה נמחקה בהצלחה", "reason": reason}

    async def search_groups(self, query: str, limit: int = 10) -> List[dict]:
        """Search groups by name for permission assignment"""
        return await self.repo.search(query, limit)
