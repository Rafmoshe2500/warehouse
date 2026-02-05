from datetime import timedelta
from fastapi import Response

from app.config import settings
from app.core.security import create_access_token
from app.core.exceptions import UnauthorizedException
from app.core.password import verify_password
from app.schemas.auth import LoginRequest, DomainLoginRequest
from app.services.group_service import GroupService
from app.services.user_service import UserService


class AuthService:
    def __init__(self):
        self.user_service = UserService()
        self.group_service = GroupService()

    async def login(self, login_data: LoginRequest, response: Response):
        """התחברות למערכת"""
        # Get user from MongoDB
        user = await self.user_service.get_user_by_username(login_data.username)
        
        if not user:
            raise UnauthorizedException()
        
        if not user.get("is_active", True):
            raise UnauthorizedException("המשתמש אינו פעיל")
        
        if not verify_password(login_data.password, user.get("password_hash", "")):
            raise UnauthorizedException()

        # Create token with role
        access_token = create_access_token(
            data={
                "sub": login_data.username,
                "username": login_data.username,
                "role": user.get("role", "user"),
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

        return {"access_token": access_token, "token_type": "bearer"}

    async def domain_login(self, login_data: DomainLoginRequest, response: Response):
        """התחברות דומיין (ADFS)"""
        username = login_data.username
        
        # 1. קבלת קבוצות המשתמש מה-ADFS (לוגיקה חיצונית/STUB)
        # TODO: כאן אתה מממש את הלוגיקה שלך לקבלת הקבוצות של המשתמש מה-ADFS
        user_adfs_groups = await self._get_user_groups_from_adfs_stub(username)
        
        if not user_adfs_groups:
             raise UnauthorizedException("לא נמצאו קבוצות למשתמש זה")

        # 2. קבלת כל הקבוצות הקיימות במערכת
        all_app_groups_result = await self.group_service.get_groups()
        all_app_groups = all_app_groups_result.get("groups", [])
        
        # 3. בדיקת חיתוך (Intersection) - האם למשתמש יש קבוצה שקיימת במערכת
        # נניח ששמות הקבוצות ב-DB זהים לשמות ב-ADFS
        valid_group = None
        for group in all_app_groups:
             if group.get("name") in user_adfs_groups:
                 valid_group = group
                 break
        
        if not valid_group:
             raise UnauthorizedException("אין לך הרשאות גישה למערכת (לא נמצאה קבוצה מתאימה)")

        # 4. יצירת טוקן
        # במקרה של דומיין, נשתמש ב-Valid Group Role או User Role דיפולטיבי
        # כרגע נניח שכל המשתמשים דרך דומיין הם במעמד 'user' או שנגדיר אחרת
        # אפשר להוסיף לוגיקה שקובעת ROLE לפי הקבוצה
        
        access_token = create_access_token(
            data={
                "sub": username,
                "username": username,
                "role": "user", # או role אחר אם יש לוגיקה מיוחדת
                "login_source": "domain",
                "group_id": valid_group.get("id")
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

        return {"access_token": access_token, "token_type": "bearer"}

    async def _get_user_groups_from_adfs_stub(self, username: str) -> list[str]:
        """
        פונקציית עזר מדמה קבלת קבוצות.
        TODO: כאן תוסיף את הלוגיקה האמיתית שלך.
        אפשר לקרוא ל-API חיצוני, לפתוח קובץ, או להשתמש בספרייה שלך.
        """
        # כרגע מחזיר רשימה פיקטיבית לבדיקה
        print(f"Fetching groups for user: {username}")
        return ["Users", "Admins", "WarehouseTeam"] # דוגמה לקבוצות שחוזרות

    async def logout(self, response: Response):
        """התנתקות"""
        response.delete_cookie(key="access_token")
        return {"message": "התנתקת בהצלחה"}

