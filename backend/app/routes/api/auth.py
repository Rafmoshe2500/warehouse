from fastapi import APIRouter, Response, Depends

from app.schemas.auth import LoginRequest, Token, DomainLoginRequest
from app.schemas.user import PasswordChange
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.dependencies import get_auth_service
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_user_service():
    return UserService()


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """התחברות למערכת"""
    return await auth_service.login(login_data, response)


@router.post("/domain-login", response_model=Token)
async def domain_login(
    login_data: DomainLoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """התחברות באמצעות דומיין (ADFS)"""
    return await auth_service.domain_login(login_data, response)


@router.post("/logout")
async def logout(
    response: Response,
    current_user: dict = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """התנתקות מהמערכת"""
    return await auth_service.logout(response)


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """קבלת פרטי משתמש מחובר"""
    return {
        "username": current_user.get("sub"),
        "role": current_user.get("role", "user"),
        "permissions": current_user.get("permissions", []),
        "user_id": current_user.get("user_id")
    }


@router.put("/password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """שינוי סיסמה עצמית"""
    return await user_service.change_password(
        user_id=current_user.get("user_id"),
        current_password=password_data.current_password,
        new_password=password_data.new_password
    )

