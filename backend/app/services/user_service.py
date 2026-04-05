from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException
import logging

from app.db.mongodb import MongoDB
from app.core.password import hash_password, verify_password
from app.core.constants import UserRole, Permission
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit.user_auditor import UserAuditor
from app.db.repositories.user_repository import UserRepository
from app.core.exceptions import NotFoundException, BadRequestException

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, auditor: UserAuditor, repo: UserRepository):
        self.auditor = auditor
        self.repo = repo
    
    def can_manage_user(
        self,
        actor_role: str,
        target_role: str,
        action: str = "manage"
    ) -> bool:
        """
        Check if actor can perform action on target user.
        
        Rules:
        - SuperAdmin can manage everyone except cannot delete/change own role
        - Admin can manage Users only, not other Admins or SuperAdmin
        - Users cannot manage anyone
        
        Args:
            actor_role: Role of person performing action
            target_role: Role of person being acted upon
            action: Type of action (manage, delete, etc.)
            
        Returns:
            True if allowed, False otherwise
        """
        # SuperAdmin can manage everyone
        if actor_role == UserRole.SUPERADMIN.value:
            return True
        
        # Admin can only manage regular users
        if actor_role == UserRole.ADMIN.value:
            return target_role == UserRole.USER.value
        
        # Regular users cannot manage anyone
        return False
    
    async def get_users(self) -> List[dict]:
        """Get all users"""
        users = await self.repo.list_users()
        return {"users": users, "total": len(users)}
    
    async def get_user_by_id(self, user_id: str) -> dict:
        """Get user by ID"""
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("משתמש לא נמצא")
        user.pop("password_hash", None)
        return user
    
    async def get_user_by_username(self, username: str) -> Optional[dict]:
        """Get user by username (includes password_hash for auth)"""
        return await self.repo.get_by_username(username)
    
    async def create_user(
        self,
        user_data: UserCreate,
        created_by: str,
        creator_role: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> dict:
        """
        Create new user with permission checking and audit logging.
        
        Args:
            user_data: User creation data
            created_by: Username of creator
            creator_role: Role of creator
            audit_service: Audit service instance (optional)
            ip_address: Client IP
            user_agent: Client user agent
            
        Returns:
            Created user data
            
        Raises:
            HTTPException: If permission denied or validation fails
        """
        
        # Permission check: Only SuperAdmin can create Admins
        if user_data.role == UserRole.ADMIN and creator_role != UserRole.SUPERADMIN.value:
            raise HTTPException(
                status_code=403,
                detail="רק SuperAdmin יכול ליצור משתמשי Admin"
            )
        
        # Check if username exists
        existing = await self.repo.get_by_username(user_data.username)
        if existing:
            raise BadRequestException("שם משתמש כבר קיים")
        
        user_doc = {
            "username": user_data.username,
            "user_type": user_data.user_type.value,
            "role": user_data.role.value,
            "permissions": user_data.permissions or [],
            "is_active": True,
            "created_by": created_by,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "last_login": None
        }
        
        # Only hash password for local users
        if user_data.user_type == "local" and user_data.password:
            user_doc["password_hash"] = hash_password(user_data.password)
        
        created_user = await self.repo.create(user_doc)
        created_user.pop("password_hash", None)
        
        # Audit log
        try:
            await self.auditor.log_create_user(
                actor=created_by,
                actor_role=creator_role,
                target_user=user_data.username,
                target_role=user_data.role.value,
                ip_address=ip_address,
                user_agent=user_agent
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
        
        logger.info(f"User created: {user_data.username} by {created_by}")
        return created_user
    
    async def update_user(
        self,
        user_id: str,
        update_data: UserUpdate,
        updated_by: str,
        updater_role: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> dict:
        """
        Update user with permission checking and audit logging.
        
        Args:
            user_id: ID of user to update
            update_data: Update data
            updated_by: Username of updater
            updater_role: Role of updater
            audit_service: Audit service instance
            ip_address: Client IP
            user_agent: Client user agent
            
        Returns:
            Updated user data
            
        Raises:
            HTTPException: If permission denied
        """
        # Check user exists
        existing = await self.repo.get_by_id(user_id)
        if not existing:
            raise NotFoundException("משתמש לא נמצא")
        
        target_role = existing.get("role")
        target_username = existing.get("username")
        
        # Cannot modify SuperAdmin
        if target_role == UserRole.SUPERADMIN.value and updater_role != UserRole.SUPERADMIN.value:
            raise HTTPException(
                status_code=403,
                detail="לא ניתן לשנות את ה-SuperAdmin"
            )
        
        # Cannot change SuperAdmin role
        if target_role == UserRole.SUPERADMIN.value and update_data.role is not None:
            raise HTTPException(
                status_code=403,
                detail="לא ניתן לשנות את תפקיד ה-SuperAdmin"
            )
        
        # Permission check
        if not self.can_manage_user(updater_role, target_role):
            raise HTTPException(
                status_code=403,
                detail="אין לך הרשאה לעדכן משתמש זה"
            )
        
        # Track changes for audit
        changes = {}
        update_dict = {"updated_at": datetime.now(timezone.utc)}
        
        if update_data.username is not None:
            # Check if new username is taken
            username_exists = await self.repo.get_by_username(update_data.username)
            if username_exists and username_exists["id"] != user_id:
                raise BadRequestException("שם משתמש כבר קיים")
            changes["username"] = {
                "old": target_username,
                "new": update_data.username
            }
            update_dict["username"] = update_data.username
        
        if update_data.role is not None:
            # Only SuperAdmin can change roles to Admin
            if update_data.role == UserRole.ADMIN and updater_role != UserRole.SUPERADMIN.value:
                raise HTTPException(
                    status_code=403,
                    detail="רק SuperAdmin יכול להעניק הרשאות Admin"
                )
            changes["role"] = {
                "old": target_role,
                "new": update_data.role.value
            }
            update_dict["role"] = update_data.role.value
        
        if update_data.permissions is not None:
            changes["permissions"] = {
                "old": existing.get("permissions", []),
                "new": update_data.permissions
            }
            update_dict["permissions"] = update_data.permissions

        if update_data.is_active is not None:
            changes["is_active"] = {
                "old": existing.get("is_active"),
                "new": update_data.is_active
            }
            update_dict["is_active"] = update_data.is_active
        
        await self.repo.update(user_id, update_dict)
        
        # Audit log
        if changes:
            try:
                await self.auditor.log_update_user(
                    actor=updated_by,
                    actor_role=updater_role,
                    target_user=target_username,
                    changes=changes
                )
            except Exception as e:
                logger.error(f"Failed to create audit log: {e}")
        
        logger.info(f"User updated: {target_username} by {updated_by}")
        return await self.get_user_by_id(user_id)
    
    async def delete_user(
        self,
        user_id: str,
        reason: str,
        deleted_by: str,
        deleter_role: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> dict:
        """
        Delete user with permission checking and audit logging.
        
        Args:
            user_id: ID of user to delete
            reason: Reason for deletion
            deleted_by: Username of deleter
            deleter_role: Role of deleter
            audit_service: Audit service instance
            ip_address: Client IP
            user_agent: Client user agent
            
        Returns:
            Deletion confirmation
            
        Raises:
            HTTPException: If permission denied
        """
        existing = await self.repo.get_by_id(user_id)
        if not existing:
            raise NotFoundException("משתמש לא נמצא")
        
        target_role = existing.get("role")
        target_username = existing.get("username")
        
        # Cannot delete SuperAdmin
        if target_role == UserRole.SUPERADMIN.value:
            raise HTTPException(
                status_code=403,
                detail="לא ניתן למחוק את ה-SuperAdmin"
            )
        
        # Permission check
        if not self.can_manage_user(deleter_role, target_role, "delete"):
            raise HTTPException(
                status_code=403,
                detail="אין לך הרשאה למחוק משתמש זה"
            )
        
        # Don't allow deleting the last admin
        if target_role == UserRole.ADMIN.value:
            admin_count = await self.repo.count({"role": UserRole.ADMIN.value})
            if admin_count <= 1:
                raise BadRequestException("לא ניתן למחוק את האדמין האחרון")
        
        await self.repo.delete(user_id)
        
        # Audit log
        try:
            await self.auditor.log_delete_user(
                actor=deleted_by,
                actor_role=deleter_role,
                target_user=target_username
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
        
        logger.info(f"User deleted: {target_username} by {deleted_by}")
        return {"message": "משתמש נמחק בהצלחה", "reason": reason}
    
    async def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str,
        ip_address: Optional[str] = None
    ) -> dict:
        """Change user's own password"""
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("משתמש לא נמצא")
        
        if not verify_password(current_password, user["password_hash"]):
            raise BadRequestException("סיסמה נוכחית שגויה")
        
        await self.repo.update(
            user_id,
            {
                "password_hash": hash_password(new_password),
                "updated_at": datetime.now(timezone.utc)
            }
        )
        
        # Audit log
        try:
            await self.auditor.log_password_change(
                actor=user.get("username"),
                actor_role=user.get("role"),
                target_user=user.get("username")
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
        
        return {"message": "סיסמה עודכנה בהצלחה"}
    
    async def update_last_login(self, username: str) -> None:
        """Update user's last login timestamp"""
        await self.repo.update_by_username(
            username,
            {"last_login": datetime.now(timezone.utc)}
        )
    
    
    async def get_user_stats(self) -> dict:
        """Get user statistics for admin dashboard"""
        total_users = await self.repo.count()
        active_users = await self.repo.count({"is_active": True})
        superadmins = await self.repo.count({"role": UserRole.SUPERADMIN.value})
        admins = await self.repo.count({"role": UserRole.ADMIN.value})
        regular_users = await self.repo.count({"role": UserRole.USER.value})
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "superadmins": superadmins,
            "admins": admins,
            "regular_users": regular_users
        }
    
    async def create_ad_user(
        self,
        username: str,
        permissions: list[str],
        role: str = "user"
    ) -> dict:
        """
        Create AD user without password (auto-created during domain login).
        
        Args:
            username: AD username
            permissions: Aggregated permissions from AD groups
            role: User role (default: user)
            
        Returns:
            Created user data
        """
        user_doc = {
            "username": username,
            "user_type": "ad",
            "role": role,
            "permissions": permissions,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "created_by": "system_ad_auto",
            "last_login": datetime.now(timezone.utc)
        }
        
        created_user = await self.repo.create(user_doc)
        
        # Audit log
        try:
            await self.auditor.log_ad_user_creation(
                username=username,
                role=role
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
        
        logger.info(f"AD user auto-created: {username}")
        return created_user

    async def search_users(self, query: str, limit: int = 10) -> List[dict]:
        """
        Search users by username or email.
        
        Args:
            query: Search term
            limit: Max results
            
        Returns:
            List of matching users (safe fields only)
        """
        return await self.repo.search(query, limit)
