"""
Core configuration and settings for the FastAPI application.
"""
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from typing import Optional, List, Set
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with proper validation and type safety."""
    
    # Database settings
    MONGODB_URL: str = Field(default="mongodb://localhost:27017", env="MONGODB_URL")
    DATABASE_NAME: str = Field(default="dashboard_db", env="DATABASE_NAME")
    
    # Facebook API settings
    FACEBOOK_APP_ID: Optional[str] = Field(default=None, env="FACEBOOK_APP_ID")
    FACEBOOK_APP_SECRET: Optional[str] = Field(default=None, env="FACEBOOK_APP_SECRET")
    FACEBOOK_API_VERSION: str = Field(default="v18.0", env="FACEBOOK_API_VERSION")
    FACEBOOK_ACCESS_TOKEN: Optional[str] = Field(default=None, env="FACEBOOK_ACCESS_TOKEN")
    
    # Facebook Page settings
    FACEBOOK_PAGE_ID: Optional[str] = Field(default=None, env="FACEBOOK_PAGE_ID")
    FACEBOOK_PAGE_TOKEN: Optional[str] = Field(default=None, env="FACEBOOK_PAGE_TOKEN")
    FACEBOOK_PAGE_NAME: Optional[str] = Field(default=None, env="FACEBOOK_PAGE_NAME")
    FACEBOOK_APP_NAME: Optional[str] = Field(default=None, env="FACEBOOK_APP_NAME")
    
    # Upload settings
    MAX_FILE_SIZE: int = Field(default=5242880, env="MAX_FILE_SIZE")  # 5MB
    MAX_FILES_PER_POST: int = Field(default=5, env="MAX_FILES_PER_POST")
    UPLOAD_FOLDER: str = Field(default="uploads/", env="UPLOAD_FOLDER")
    ALLOWED_EXTENSIONS: str = Field(
        default="jpg,jpeg,png,gif,webp", 
        env="ALLOWED_EXTENSIONS"
    )
    
    # CORS settings
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        env="ALLOWED_ORIGINS"
    )
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    # Redis/Cache settings (for APScheduler)
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    

    
    @field_validator("UPLOAD_FOLDER")
    @classmethod
    def validate_upload_folder(cls, v):
        """Ensure upload folder exists and is writable."""
        upload_path = Path(v)
        upload_path.mkdir(parents=True, exist_ok=True)
        return str(upload_path)
    
    @field_validator("ALLOWED_EXTENSIONS")
    @classmethod
    def validate_extensions(cls, v):
        """Ensure extensions are lowercase and valid."""
        if isinstance(v, str):
            return v.lower().strip()
        return v
    
    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def validate_origins(cls, v):
        """Parse CORS origins from string if needed."""
        if isinstance(v, str):
            return v.strip()
        return v
    
    @property
    def allowed_extensions_set(self) -> set[str]:
        """Get allowed extensions as a set."""
        return {ext.lower().strip() for ext in self.ALLOWED_EXTENSIONS.split(",")}
    
    @property
    def allowed_origins_list(self) -> list[str]:
        """Get allowed origins as a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def database_url_parsed(self) -> dict:
        """Parse MongoDB URL for connection details."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(self.MONGODB_URL)
            return {
                "host": parsed.hostname or "localhost",
                "port": parsed.port or 27017,
                "username": parsed.username,
                "password": parsed.password,
            }
        except Exception:
            return {"host": "localhost", "port": 27017, "username": None, "password": None}
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()