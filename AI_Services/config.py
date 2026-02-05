import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = "MyCalo AI Service"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

    def validate(self):
        if not self.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not found in .env file")
        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY not found. Please copy it from Django Backend .env"
            )


settings = Settings()
settings.validate()
