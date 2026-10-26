"""Central configuration, driven by environment variables (12-factor style)."""
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()
ROOT = Path(__file__).resolve().parents[2]


class Config:
    DEBUG = os.getenv("FLASK_ENV", "production") == "development"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "finance_assistant")
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
    MODEL_DIR = Path(os.getenv("MODEL_DIR", ROOT / "models"))
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024          # 8 MB upload cap (receipt images)
    ALLOWED_IMAGE_EXT = {"png", "jpg", "jpeg", "webp", "bmp"}
    TESSERACT_CMD = os.getenv("TESSERACT_CMD")
    CATEGORIES = ["Food", "Transport", "Shopping", "Education", "Entertainment",
                  "Bills", "Healthcare", "Travel", "Others"]
    BUDGET_CATEGORIES = ["Food", "Travel", "Shopping", "Entertainment"]


class TestConfig(Config):
    TESTING = True
    JWT_SECRET_KEY = "test-secret-with-enough-length-for-hs256-ok"
    MONGO_URI = "mongomock://localhost"
    MONGO_DB_NAME = "test_db"
