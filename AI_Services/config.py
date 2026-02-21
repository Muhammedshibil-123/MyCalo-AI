import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = "MyCalo AI Service"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    DOC_GROQ_API_KEY: str = os.getenv("DOC_GROQ_API_KEY")

    BACKUP_GEMINI_KEY: str = os.getenv("BACKUP_GEMINI_KEY")

    DATABASE_PASSWORD: str = os.getenv("DATABASE_PASSWORD")

    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

    def validate(self):
        if not self.GEMINI_API_KEY:
            self.GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

        if not self.BACKUP_GEMINI_KEY:
            self.BACKUP_GEMINI_KEY = self.BACKUP_GEMINI_KEY

        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY not found. Please copy it from Django Backend .env"
            )
        if not self.DATABASE_PASSWORD:
            print("Warning: DATABASE_PASSWORD not set. SQL Tool will fail.")

        if not self.DOC_GROQ_API_KEY:
            print("Warning: DOC_GROQ_API_KEY not set. Doctor AI Assistant will fail.")


settings = Settings()
settings.validate()
