"""
Initialize the first admin user from environment variables
"""
from app.config import settings
from app.services.user_service import UserService


async def init_admin():
    """Create initial admin user if no users exist"""
    user_service = UserService()
    await user_service.create_initial_admin(
        username=settings.USERNAME,
        password=settings.PASSWORD
    )
