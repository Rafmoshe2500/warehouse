from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
import logging

from app.db.mongodb import MongoDB
from app.core.password import hash_password, verify_password
from app.core.constants import UserRole, Permission
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.audit import AuditAction
from app.core.exceptions import NotFoundException, BadRequestException

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self):
        self.collection_name = "users"
    
    def _get_collection(self):
        return MongoDB.get_permissions_collection(self.collection_name)
    
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
        collection = self._get_collection()
        users = []
        async for user in collection.find():
            user["id"] = str(user.pop("_id"))
            user.pop("password_hash", None)
            users.append(user)
        return {"users": users, "total": len(users)}
    
    async def get_user_by_id(self, user_id: str) -> dict:
        """Get user by ID"""
        collection = self._get_collection()
        user = await collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise NotFoundException("משתמש לא נמצא")
        user["id"] = str(user.pop("_id"))
        user.pop("password_hash", None)
        return user
    
    async def get_user_by_username(self, username: str) -> Optional[dict]:
        """Get user by username (includes password_hash for auth)"""
        collection = self._get_collection()
        user = await collection.find_one({"username": username})
        if user:
            user["id"] = str(user.pop("_id"))
        return user
    
    async def create_user(
        self,
        user_data: UserCreate,
        created_by: str,
        creator_role: str,
        audit_service=None,
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
        collection = self._get_collection()
        
        # Permission check: Only SuperAdmin can create Admins
        if user_data.role == UserRole.ADMIN and creator_role != UserRole.SUPERADMIN.value:
            raise HTTPException(
                status_code=403,
                detail="רק SuperAdmin יכול ליצור משתמשי Admin"
            )
        
        # Check if username exists
        existing = await collection.find_one({"username": user_data.username})
        if existing:
            raise BadRequestException("שם משתמש כבר קיים")
        
        user_doc = {
            "username": user_data.username,
            "password_hash": hash_password(user_data.password),
            "role": user_data.role.value,
            "permissions": user_data.permissions or [],
            "is_active": True,
            "created_by": created_by,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None
        }
        
        result = await collection.insert_one(user_doc)
        user_doc["id"] = str(result.inserted_id)
        user_doc.pop("_id", None)
        user_doc.pop("password_hash", None)
        
        # Audit log
        if audit_service:
            try:
                await audit_service.log_user_action(
                    action=AuditAction.USER_CREATE,
                    actor=created_by,
                    actor_role=creator_role,
                    target_user=user_data.username,
                    target_role=user_data.role.value,
                    target_resource="user",
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception as e:
                logger.error(f"Failed to create audit log: {e}")
        
        logger.info(f"User created: {user_data.username} by {created_by}")
        return user_doc
    
    async def update_user(
        self,
        user_id: str,
        update_data: UserUpdate,
        updated_by: str,
        updater_role: str,
        audit_service=None,
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
        collection = self._get_collection()
        
        # Check user exists
        existing = await collection.find_one({"_id": ObjectId(user_id)})
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
        update_dict = {"updated_at": datetime.utcnow()}
        
        if update_data.username is not None:
            # Check if new username is taken
            username_exists = await collection.find_one({
                "username": update_data.username,
                "_id": {"$ne": ObjectId(user_id)}
            })
            if username_exists:
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
        
        await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_dict}
        )
        
        # Audit log
        if audit_service and changes:
            try:
                await audit_service.log_user_action(
                    action=AuditAction.USER_UPDATE,
                    actor=updated_by,
                    actor_role=updater_role,
                    target_user=target_username,
                    target_role=target_role,
                    target_resource="user",
                    changes=changes,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception as e:
                logger.error(f"Failed to create audit log: {e}")
        
        return await self.get_user_by_id(user_id)
    
    async def delete_user(
        self,
        user_id: str,
        reason: str,
        deleted_by: str,
        deleter_role: str,
        audit_service=None,
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
        collection = self._get_collection()
        
        existing = await collection.find_one({"_id": ObjectId(user_id)})
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
            admin_count = await collection.count_documents({"role": UserRole.ADMIN.value})
            if admin_count <= 1:
                raise BadRequestException("לא ניתן למחוק את האדמין האחרון")
        
        await collection.delete_one({"_id": ObjectId(user_id)})
        
        # Audit log
        if audit_service:
            try:
                await audit_service.log_user_action(
                    action=AuditAction.USER_DELETE,
                    actor=deleted_by,
                    actor_role=deleter_role,
                    target_user=target_username,
                    target_role=target_role,
                    target_resource="user",
                    reason=reason,
                    ip_address=ip_address,
                    user_agent=user_agent
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
        audit_service=None,
        ip_address: Optional[str] = None
    ) -> dict:
        """Change user's own password"""
        collection = self._get_collection()
        
        user = await collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise NotFoundException("משתמש לא נמצא")
        
        if not verify_password(current_password, user["password_hash"]):
            raise BadRequestException("סיסמה נוכחית שגויה")
        
        await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "password_hash": hash_password(new_password),
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Audit log
        if audit_service:
            try:
                await audit_service.log_user_action(
                    action=AuditAction.PASSWORD_CHANGE,
                    actor=user.get("username"),
                    actor_role=user.get("role"),
                    target_user=user.get("username"),
                    target_role=user.get("role"),
                    target_resource="user",
                    ip_address=ip_address
                )
            except Exception as e:
                logger.error(f"Failed to create audit log: {e}")
        
        return {"message": "סיסמה עודכנה בהצלחה"}
    
    async def update_last_login(self, username: str) -> None:
        """Update user's last login timestamp"""
        collection = self._get_collection()
        await collection.update_one(
            {"username": username},
            {"$set": {"last_login": datetime.utcnow()}}
        )
    
    async def create_initial_admin(self, username: str, password: str) -> bool:
        """
        Create initial SuperAdmin from env vars if no users exist.
        
        Args:
            username: SuperAdmin username (should be 'admin')
            password: SuperAdmin password
            
        Returns:
            True if created, False if users already exist
        """
        collection = self._get_collection()
        
        # Check if any users exist
        count = await collection.count_documents({})
        if count > 0:
            # Check if admin exists and update to superadmin if needed
            admin_user = await collection.find_one({"username": username})
            if admin_user and admin_user.get("role") != UserRole.SUPERADMIN.value:
                await collection.update_one(
                    {"username": username},
                    {"$set": {
                        "role": UserRole.SUPERADMIN.value,
                        "created_by": "system",
                        "updated_at": datetime.utcnow()
                    }}
                )
                logger.info(f"✅ Updated '{username}' to SuperAdmin role")
                return True
            return False
        
        user_doc = {
            "username": username,
            "password_hash": hash_password(password),
            "role": UserRole.SUPERADMIN.value,
            "permissions": [Permission.ADMIN.value, Permission.INVENTORY_RW.value, Permission.PROCUREMENT_RW.value],
            "is_active": True,
            "created_by": "system",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None
        }
        
        await collection.insert_one(user_doc)
        logger.info(f"✅ Initial SuperAdmin user '{username}' created")
        return True
    
    async def get_user_stats(self) -> dict:
        """Get user statistics for admin dashboard"""
        collection = self._get_collection()
        
        total_users = await collection.count_documents({})
        active_users = await collection.count_documents({"is_active": True})
        superadmins = await collection.count_documents({"role": UserRole.SUPERADMIN.value})
        admins = await collection.count_documents({"role": UserRole.ADMIN.value})
        regular_users = await collection.count_documents({"role": UserRole.USER.value})
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "superadmins": superadmins,
            "admins": admins,
            "regular_users": regular_users
        }
