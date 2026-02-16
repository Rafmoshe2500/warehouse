from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.constants import UserRole, Permission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """יצירת JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """אימות JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise UnauthorizedException("Could not validate credentials")
        return payload
    except JWTError:
        raise UnauthorizedException("Could not validate credentials")


async def get_current_user(
        request: Request,
        token: Optional[str] = Depends(oauth2_scheme)
) -> dict:
    """קבלת משתמש מחובר"""
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise UnauthorizedException("Not authenticated")

    return verify_token(token)


async def get_current_user_groups(
        current_user: dict = Depends(get_current_user)
) -> list[str]:
    """Get the groups the current user belongs to."""
    groups = current_user.get("groups", [])
    
    # Mock for dev/test if empty AND in development environment
    if not groups and settings.ENVIRONMENT == "development":
        # Default mock groups for everyone
        groups = ["All Users", "Domain Users"]
        
        # Add simpler mock logic based on role for testing
        if current_user.get("role") in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            groups.extend(["Admins", "Management"])
        
        if current_user.get("username") == "user": # Specific mock for 'user'
             groups.extend(["Designers"])
             
    return groups


async def require_admin(
        current_user: dict = Depends(get_current_user)
) -> dict:
    """וידוא שהמשתמש הוא אדמין או סופר-אדמין או בעל הרשאת אדמין"""
    user_role = current_user.get("role")
    user_permissions = current_user.get("permissions", [])
    
    if user_role not in [UserRole.ADMIN, UserRole.SUPERADMIN] and Permission.ADMIN not in user_permissions:
        raise ForbiddenException("נדרשות הרשאות אדמין")
    return current_user


async def require_superadmin(
        current_user: dict = Depends(get_current_user)
) -> dict:
    """וידוא שהמשתמש הוא סופר-אדמין בלבד"""
    if current_user.get("role") != UserRole.SUPERADMIN:
        raise ForbiddenException("נדרשות הרשאות SuperAdmin")
    return current_user


def require_permission(permission: str):
    """Dependency factory to require a specific permission."""
    async def permission_dependency(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        user_role = current_user.get("role")
        user_permissions = current_user.get("permissions", [])
        
        # SuperAdmin has all permissions
        if user_role == UserRole.SUPERADMIN:
            return current_user
            
        if permission not in user_permissions:
            # Check for implied permissions (RW implies RO)
            if permission.endswith(":ro"):
                rw_permission = permission.replace(":ro", ":rw")
                if rw_permission in user_permissions:
                    return current_user
            
            raise ForbiddenException(f"נדרשת הרשאה: {permission}")
        return current_user
    
    return permission_dependency
