from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    UserProfile,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

REFRESH_TOKEN_COOKIE = "refresh_token"
ACCESS_TOKEN_COOKIE = "access_token"


def set_auth_cookies(response: Response, auth_data: AuthResponse) -> None:
    """Sets HTTPOnly and client-accessible auth cookies for persistent browser sessions."""
    # 7-day sliding refresh token cookie (HTTPOnly for XSS security)
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=auth_data.refreshToken,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.SESSION_INACTIVITY_DAYS * 24 * 60 * 60,
        path="/",
    )
    # Access token cookie
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=auth_data.accessToken,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


# =========================================================
# REGISTER
# =========================================================

@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await AuthService.register_user(db, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return MessageResponse(
        message=f"Verification code sent to {user.email}. Please verify your email to access the workspace.",
        success=True,
        cooldownSeconds=settings.OTP_RESEND_COOLDOWN_SECONDS,
    )


# =========================================================
# RESEND OTP
# =========================================================

@router.post(
    "/resend-otp",
    response_model=MessageResponse,
)
async def resend_otp(
    data: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        res = await AuthService.resend_verification_otp(db, data.email)
        return MessageResponse(
            message=res["message"],
            success=True,
            cooldownSeconds=res.get("cooldownSeconds"),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS if "wait" in str(exc).lower() else status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# =========================================================
# VERIFY EMAIL (OTP)
# =========================================================

@router.post(
    "/verify-email",
    response_model=AuthResponse,
)
async def verify_email(
    data: VerifyEmailRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    try:
        auth_data = await AuthService.verify_email(
            db=db,
            data=data,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        set_auth_cookies(response, auth_data)
        return auth_data
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=AuthResponse,
)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    try:
        auth_data = await AuthService.login(
            db=db,
            data=data,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        set_auth_cookies(response, auth_data)
        return auth_data
    except ValueError as exc:
        if str(exc) == "EMAIL_NOT_VERIFIED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="EMAIL_NOT_VERIFIED",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


# =========================================================
# GOOGLE LOGIN
# =========================================================

@router.post(
    "/google",
    response_model=AuthResponse,
)
async def google_auth(
    data: GoogleLoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    try:
        auth_data = await AuthService.google_login(
            db=db,
            credential=data.credential,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        set_auth_cookies(response, auth_data)
        return auth_data
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# =========================================================
# GET CURRENT USER PROFILE & SLIDE SESSION (/auth/me)
# =========================================================

@router.get(
    "/me",
    response_model=UserProfile,
)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return AuthService.user_to_profile(current_user)


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    await AuthService.forgot_password(db, data.email)
    return MessageResponse(
        message="If that institutional email is registered, recovery instructions have been dispatched.",
        success=True,
    )


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    new_password = data.newPassword
    if not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password is required.",
        )

    try:
        await AuthService.reset_password(db, data.token, new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return MessageResponse(
        message="Password has been reset successfully. All previous sessions have been revoked.",
        success=True,
    )


# =========================================================
# REFRESH TOKEN (7-DAY SLIDING WINDOW)
# =========================================================

@router.post(
    "/refresh",
    response_model=AuthResponse,
)
async def refresh_token(
    request: Request,
    response: Response,
    body: RefreshTokenRequest | None = None,
    cookie_refresh_token: str | None = Cookie(
        default=None,
        alias=REFRESH_TOKEN_COOKIE,
    ),
    db: AsyncSession = Depends(get_db),
):
    # Support dual transport: body payload or HTTPOnly cookie or auth header
    token = None
    if body and body.refreshToken:
        token = body.refreshToken
    elif cookie_refresh_token:
        token = cookie_refresh_token
    else:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session refresh token provided.",
        )

    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    try:
        auth_data = await AuthService.refresh_session(
            db=db,
            refresh_token_str=token,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        set_auth_cookies(response, auth_data)
        return auth_data
    except ValueError as exc:
        # Clear invalid cookies
        response.delete_cookie(key=REFRESH_TOKEN_COOKIE, path="/")
        response.delete_cookie(key=ACCESS_TOKEN_COOKIE, path="/")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


# =========================================================
# LOGOUT (IMMEDIATE SESSION REVOCATION)
# =========================================================

@router.post(
    "/logout",
    response_model=MessageResponse,
)
async def logout(
    request: Request,
    response: Response,
    body: LogoutRequest | None = None,
    cookie_refresh_token: str | None = Cookie(
        default=None,
        alias=REFRESH_TOKEN_COOKIE,
    ),
    db: AsyncSession = Depends(get_db),
):
    token = None
    if body and body.refreshToken:
        token = body.refreshToken
    elif cookie_refresh_token:
        token = cookie_refresh_token

    if token:
        await AuthService.logout_session(db, refresh_token_str=token)

    response.delete_cookie(key=REFRESH_TOKEN_COOKIE, path="/")
    response.delete_cookie(key=ACCESS_TOKEN_COOKIE, path="/")

    return MessageResponse(
        message="Logged out successfully. Active session revoked.",
        success=True,
    )