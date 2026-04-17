from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./emohub.db"
    storage_root: str = "./data"
    thumbnail_root: str = "./data/thumbnails"
    internal_worker_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
