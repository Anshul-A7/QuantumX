from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.routes.auth import router as auth_router
from app.api.routes.user import router as user_router
from app.api.routes.datasets import router as datasets_router
from app.api.routes.screenings import router as screenings_router
from app.api.routes.notifications import router as notifications_router


def humanize_validation_error(err: dict) -> str:
    """Translates raw Pydantic validation errors into simple, clear human language."""
    loc = err.get("loc", [])
    field = str(loc[-1]) if loc else "field"
    err_type = err.get("type", "")
    msg = err.get("msg", "")

    field_names = {
        "password": "Password",
        "newPassword": "New password",
        "new_password": "New password",
        "email": "Email address",
        "username": "Full name",
        "fullName": "Full name",
        "full_name": "Full name",
        "token": "Verification code",
        "otp": "Verification code",
    }
    field_display = field_names.get(field, field.replace("_", " ").capitalize())

    if "string_too_short" in err_type or "at least" in msg.lower():
        ctx = err.get("ctx", {})
        min_len = ctx.get("min_length", 8)
        return f"{field_display} must be at least {min_len} characters long."
    elif "string_too_long" in err_type or "at most" in msg.lower():
        ctx = err.get("ctx", {})
        max_len = ctx.get("max_length", 128)
        return f"{field_display} cannot exceed {max_len} characters."
    elif "missing" in err_type or "required" in msg.lower():
        return f"{field_display} is required. Please fill it in."
    elif "email" in field.lower() or "email" in err_type or "value_error" in err_type:
        return "Please enter a valid email address."
    elif "password" in field.lower():
        return f"{field_display} is invalid. Please choose a secure password."
    else:
        return f"Please check {field_display.lower()}."


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize all database tables on startup
    await init_db()
    print("[QuantumX Backend] Database Initialized & Connected.")
    yield


app = FastAPI(
    title="Quantum ML Platform Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Custom validation error handler for simple, human-friendly messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    if errors:
        primary_msg = humanize_validation_error(errors[0])
    else:
        primary_msg = "Please check your information and try again."

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": primary_msg,
            "message": primary_msg,
        },
    )

# CORS configuration allowing Next.js frontend on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.JWT_SECRET_KEY,
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(datasets_router)
app.include_router(screenings_router)
app.include_router(notifications_router)


@app.get("/")
async def root():
    return {
        "service": "QuantumX Hybrid Quantum ML Platform Backend",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "quantum-ml-platform-backend",
    }