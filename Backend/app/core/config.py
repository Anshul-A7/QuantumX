from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # =========================================================
    # DATABASE
    # =========================================================

    DATABASE_URL: str

    # =========================================================
    # JWT & SESSION CONFIGURATION (7-DAY SLIDING WINDOW)
    # =========================================================

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SESSION_INACTIVITY_DAYS: int = 7

    # =========================================================
    # OTP SECURITY & RATE LIMITING
    # =========================================================

    OTP_EXPIRE_MINUTES: int = 15
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

    # =========================================================
    # COOKIE SECURITY
    # =========================================================

    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # =========================================================
    # GOOGLE OAUTH
    # =========================================================

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    GOOGLE_REDIRECT_URI: str = (
        "http://127.0.0.1:8000/auth/google/callback"
    )

    # =========================================================
    # FRONTEND
    # =========================================================

    FRONTEND_URL: str = "http://localhost:3000"

    # =========================================================
    # EMAIL / SMTP
    # =========================================================

    EMAIL_HOST: str
    EMAIL_PORT: int = 587
    EMAIL_USERNAME: str
    EMAIL_PASSWORD: str
    EMAIL_FROM: str

    # =========================================================
    # SETTINGS CONFIG
    # =========================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()