from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# =========================================================
# USER PROFILE SCHEMAS
# =========================================================

class UserProfile(BaseModel):
    id: int
    username: str
    email: EmailStr
    fullName: str | None = Field(default=None, serialization_alias="fullName")
    role: str = Field(default="USER", serialization_alias="role")
    authProvider: str = Field(default="LOCAL", serialization_alias="authProvider")
    emailVerified: bool = Field(default=False, serialization_alias="emailVerified")
    profileImageUrl: str | None = Field(default=None, serialization_alias="profileImageUrl")
    createdAt: str | None = Field(default=None, serialization_alias="createdAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


UserResponse = UserProfile


# =========================================================
# AUTH RESPONSE & SESSION
# =========================================================

class AuthResponse(BaseModel):
    accessToken: str = Field(serialization_alias="accessToken")
    refreshToken: str = Field(serialization_alias="refreshToken")
    tokenType: str = Field(default="bearer", serialization_alias="tokenType")
    expiresIn: int = Field(default=3600, serialization_alias="expiresIn")
    user: UserProfile

    model_config = ConfigDict(
        populate_by_name=True,
    )


class SessionInfo(BaseModel):
    id: str
    userId: int = Field(serialization_alias="userId")
    userAgent: str | None = Field(default=None, serialization_alias="userAgent")
    ipAddress: str | None = Field(default=None, serialization_alias="ipAddress")
    lastActivityAt: str = Field(serialization_alias="lastActivityAt")
    expiresAt: str = Field(serialization_alias="expiresAt")
    isRevoked: bool = Field(default=False, serialization_alias="isRevoked")
    createdAt: str = Field(serialization_alias="createdAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class MessageResponse(BaseModel):
    message: str
    success: bool = True
    cooldownSeconds: int | None = Field(default=None, serialization_alias="cooldownSeconds")


# =========================================================
# REGISTER
# =========================================================

class RegisterRequest(BaseModel):
    username: str | None = None
    fullName: str | None = Field(default=None, alias="full_name")
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
    )

    model_config = ConfigDict(
        populate_by_name=True,
    )


# =========================================================
# LOGIN
# =========================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=1,
        max_length=128,
    )


# =========================================================
# REFRESH TOKEN REQUEST
# =========================================================

class RefreshTokenRequest(BaseModel):
    refreshToken: str | None = Field(default=None, alias="refresh_token")

    model_config = ConfigDict(
        populate_by_name=True,
    )


# =========================================================
# GOOGLE LOGIN
# =========================================================

class GoogleLoginRequest(BaseModel):
    credential: str


# =========================================================
# EMAIL VERIFICATION
# =========================================================

class VerifyEmailRequest(BaseModel):
    email: EmailStr | None = None
    otp: str | None = None
    token: str | None = None


class ResendVerificationRequest(BaseModel):
    email: EmailStr


ResendOtpRequest = ResendVerificationRequest


# =========================================================
# FORGOT / RESET PASSWORD
# =========================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    newPassword: str | None = Field(default=None, alias="new_password")

    model_config = ConfigDict(
        populate_by_name=True,
    )


# =========================================================
# LOGOUT
# =========================================================

class LogoutRequest(BaseModel):
    refreshToken: str | None = Field(default=None, alias="refresh_token")

    model_config = ConfigDict(
        populate_by_name=True,
    )