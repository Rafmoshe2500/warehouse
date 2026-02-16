import httpx
from fastapi import Request
from typing import Dict, Optional, Any
import logging

from app.config import settings

logger = logging.getLogger(__name__)

class ADFSService:
    def __init__(self):
        pass
    
    async def get_token_from_hashed_token(self, hashed_token: str, request: Request) -> Dict[str, Any]:
        """Exchange hashed token for access token (Async)"""
        url = f"{settings.ADFS_LOGIN_URL}?hashed_token={hashed_token}"
        try:
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(
                    url, 
                    headers={"Cookie": request.headers.get("cookie", "")}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get token from ADFS: {e}")
            return {}

    async def get_user_information(self, token: Dict[str, Any]) -> Dict[str, Any]:
        """Get user info from token (Async)"""
        # Assuming token contains access_token or similar
        # Adjust implementation based on actual ADFS response structure
        # This implementation mimics the original synchronous one which passed the whole token dict?
        # Original: requests.get(f"...token={token}") - token was passed as arg.
        # But wait, logic in auth_service says: 
        # token = await get_token...
        # user_info = await get_user_info(token)
        
        # If token is a dict, we probably need a specific field. 
        # For now, let's assume 'token' argument is the string token if the previous method returned it, 
        # or we extract it. 
        # However, the previous code was: f"...token={token}". 
        # If token is a dict, this string formatting would be ugly.
        # Let's assume it wants the access token string.
        
        access_token = token.get("access_token") if isinstance(token, dict) else token
        
        url = f"{settings.ADFS_TOKEN_INFO_URL}?token={access_token}"
        try:
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to get user info from ADFS: {e}")
            return {}

    async def validate_user_in_group(self, user: str, group: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate user group membership (Async)"""
        url = f"{settings.ADFS_VALIDATE_URL}/user/group={group['name']}&user={user}"
        try:
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return group
                return None
        except Exception as e:
            logger.error(f"Failed to validate user group: {e}")
            return None