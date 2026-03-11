from datetime import timedelta
from fastapi import Response, Request
import logging

from app.config import settings
from app.core.security import create_access_token
from app.core.exceptions import UnauthorizedException
from app.core.password import verify_password
from app.schemas.auth import LoginRequest, DomainLoginRequest
from app.services.group_service import GroupService
from app.services.user_service import UserService
from app.services.adfs_service import ADFSService
from app.services.audit.auth_auditor import AuthAuditor

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(
        self,
        user_service: UserService,
        group_service: GroupService,
        adfs_service: ADFSService,
        auth_auditor: AuthAuditor
    ):
        self.user_service = user_service
        self.group_service = group_service
        self.adfs_service = adfs_service
        self.auth_auditor = auth_auditor

    async def login(self, login_data: LoginRequest, response: Response, request: Request):
        """התחברות למערכת"""
        # Get user from MongoDB
        user = await self.user_service.get_user_by_username(login_data.username)
        
        if not user:
            raise UnauthorizedException()
        
        if not user.get("is_active", True):
            raise UnauthorizedException("המשתמש אינו פעיל")
        
        if not verify_password(login_data.password, user.get("password_hash", "")):
            raise UnauthorizedException()

        # Create token with role and permissions
        access_token = create_access_token(
            data={
                "sub": login_data.username,
                "username": login_data.username,
                "role": user.get("role", "user"),
                "permissions": user.get("permissions", []),
                "user_id": user.get("id")
            },
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
            secure=False  # ב-HTTPS בפרודקשן להפוך ל-True
        )

        # Audit Log
        if self.auth_auditor:
            try:
                await self.auth_auditor.log_login(
                    username=user.get("username"),
                    user_id=str(user.get("id", "")),
                    role=user.get("role"),
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent")
                )
            except Exception as e:
                logger.error(f"Failed to log login: {e}")

        return {"access_token": access_token, "token_type": "bearer"}

    async def domain_login(self, login_data: DomainLoginRequest, response: Response, request: Request):
        """התחברות דומיין (ADFS) - with existing user check"""      
        token = await self.adfs_service.get_token_from_hashed_token(login_data.hashed_token, request)
        user_information = await self.adfs_service.get_user_information(token)
        
        if not user_information:
            raise UnauthorizedException("Failed to get user information from ADFS")
        
        username = user_information.get("sAMAccountName")
        if not username:
            raise UnauthorizedException("Username not found in ADFS response")
        
        existing_user = await self.user_service.get_user_by_username(username)
        
        if existing_user:
            if existing_user.get("user_type") != "ad":
                raise UnauthorizedException("User exists but is not an AD user")
            
            if not existing_user.get("is_active", True):
                raise UnauthorizedException("User account is disabled")
            
            permissions = existing_user.get("permissions", [])
            role = existing_user.get("role", "user")
            
            await self.user_service.update_last_login(username)
            
        else:
            user_ad_groups = user_information.get("groups", [])
            
            if not user_ad_groups:
                raise UnauthorizedException("No AD groups found for user")
            
            all_app_groups_result = await self.group_service.get_groups()
            all_app_groups = all_app_groups_result.get("groups", [])
            
            user_group_names = {g.lower() for g in user_ad_groups}
            matched_groups = [
                g for g in all_app_groups 
                if g.get("name", "").lower() in user_group_names
            ]
            
            if not matched_groups:
                raise UnauthorizedException("No matching groups found - access denied")
            
            all_permissions = set()
            for group in matched_groups:
                all_permissions.update(group.get("permissions", []))
            
            permissions = list(all_permissions)
            role = "user"
        
        access_token = create_access_token(
            data={
                "sub": username,
                "username": username,
                "role": role,
                "permissions": permissions,
                "login_source": "domain"
            },
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
            secure=False
        )

        if self.auth_auditor:
            try:
                await self.auth_auditor.log_domain_login(
                    username=username,
                    role=role,
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent")
                )
            except Exception as e:
                logger.error(f"Failed to log domain login: {e}")

        return {"access_token": access_token, "token_type": "bearer"}

    async def _get_user_groups_from_adfs_stub(self, username: str) -> list[str]:
        """
        פונקציית עזר מדמה קבלת קבוצות.
        כרגע מחזיר רשימה פיקטיבית לבדיקה.
        """
        return ["Users", "Admins", "WarehouseTeam"]

    async def logout(self, response: Response, user: dict, request: Request):
        """התנתקות"""
        response.delete_cookie(key="access_token")
        
        # Audit Log
        if self.auth_auditor and user:
            try:
                await self.auth_auditor.log_logout(
                    username=user.get("username", "unknown"),
                    role=user.get("role", "unknown"),
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent")
                )
            except Exception as e:
                logger.error(f"Failed to log logout: {e}")
                
        return {"message": "התנתקת בהצלחה"}

