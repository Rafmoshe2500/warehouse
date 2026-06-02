from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str
    DB_NAME: str = "warehouse"
    DB_TEST: str = "warehouse_test"
    ENVIRONMENT: str = "production"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 240
    
    # Init Admin (loaded from env)
    USERNAME: str = "admin"
    PASSWORD: str  # Must be provided in env

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
    S3_ENDPOINT_URL: str = ""

    # ADFS Settings
    ADFS_LOGIN_URL: str = "https://adfs.example.com/adfs/oauth2/token"
    ADFS_TOKEN_INFO_URL: str = "https://adfs.example.com/adfs/oauth2/tokeninfo"
    ADFS_VALIDATE_URL: str = "https://adfs.example.com/adfs/validate"

    # Logging
    LOG_LEVEL: str = "INFO"
    # Audit logging options
    # Set to False to disable logging of user login events
    AUDIT_LOG_LOGIN: bool = True

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
