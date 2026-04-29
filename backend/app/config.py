from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    SECRET_KEY: str = "default-secret-key-change-me"
    DATABASE_URL: str = "sqlite:///./graphauth.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    UPLOAD_DIR: str = "static/uploads"
    PASSFACES_DIR: str = "static/passfaces"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
