from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str
    DB_NAME: str = "warehouse"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 240

    # Auth
    USERNAME: str = 'admin'
    PASSWORD: str = 'password'

    # CORS - Default to localhost for dev, can be overridden by env
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173", # Vite default
        "http://127.0.0.1:5173" 
    ]

    # S3 Storage (optional)
    USE_S3: bool = False
    S3_BUCKET_NAME: str = ""
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
