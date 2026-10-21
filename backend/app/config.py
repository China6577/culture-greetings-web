import os
from dataclasses import dataclass, field

@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv('DATABASE_URL', 'postgresql+psycopg://greetings:invalid@db/greetings')
    agnes_api_key: str = field(default_factory=lambda: os.getenv('AGNES_API_KEY', ''), repr=False)
    agnes_base_url: str = 'https://apihub.agnes-ai.com/v1'
    text_model: str = 'agnes-2.5-flash'
    image_model: str = 'agnes-image-2.5-flash'
    assets_dir: str = os.getenv('ASSETS_DIR', '/data/cards')
    generation_timeout: float = 900

settings = Settings()
