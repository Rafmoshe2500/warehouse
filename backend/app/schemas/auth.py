from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class DomainLoginRequest(BaseModel):
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str

class DeleteRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="סיבת המחיקה - חובה")
    ids: Optional[list[str]] = None
    delete_all: bool = False

