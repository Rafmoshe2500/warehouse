import requests
from fastapi import Request

class ADFSService:
    def __init__(self):
        pass
    
    def get_token_from_hashed_token(self, hashed_token: str, request: Request) -> list[str]:
        response = requests.get(f"https://adfs.example.com/adfs/oauth2/token?hashed_token={hashed_token}",
        headers={"Cookie": request.cookies},
        verify=False)
        return response.json()

    def get_token_info(self, token: str) -> Dict[str, any]:
        response = requests.get(f"https://adfs.example.com/adfs/oauth2/tokeninfo?token={token}")
        return response.json()

    def validate_user_in_group(self, user, group: Dict[str, any]) -> Dict[str, any] | None:
        response = requests.get(f"https://adfs.example.com/adfs/validate/user/group={group['name']}&user={user}")
        if response.status_code == 200:
            return group
        return None