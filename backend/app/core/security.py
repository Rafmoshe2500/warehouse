from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """יצירת JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
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


async def require_admin(
        current_user: dict = Depends(get_current_user)
) -> dict:
    """וידוא שהמשתמש הוא אדמין או סופר-אדמין"""
    user_role = current_user.get("role")
    if user_role not in ["admin", "superadmin"]:
        raise ForbiddenException("נדרשות הרשאות אדמין")
    return current_user


async def require_superadmin(
        current_user: dict = Depends(get_current_user)
) -> dict:
    """וידוא שהמשתמש הוא סופר-אדמין בלבד"""
    if current_user.get("role") != "superadmin":
        raise ForbiddenException("נדרשות הרשאות SuperAdmin")
    return current_user


def verify_delete_password(password: str) -> bool:
    """אימות סיסמת מחיקה"""
    return password == settings.DELETE_PASSWORD

