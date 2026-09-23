from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./qa.db"
    cors_origins: str = "*"
    upload_dir: str = "uploads"

settings = Settings()
