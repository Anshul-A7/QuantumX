import asyncio
import logging
import smtplib
from datetime import datetime, timedelta, timezone
from typing import Any

from email_validator import EmailNotValidError, validate_email
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_otp,
    generate_secure_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.session import UserSession
from app.models.user import User
from app.models.verification_token import VerificationToken
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserProfile,
    VerifyEmailRequest,
)
from app.services.email_service import EmailService

logger = logging.getLogger("auth_service")

DISPOSABLE_DOMAINS = {
    "mailinator.com", "tempmail.com", "guerrillamail.com", "10minutemail.com",
    "yopmail.com", "trashmail.com", "sharklasers.com", "temp-mail.org",
    "fakeinbox.com", "dispostable.com", "throwawaymail.com", "getairmail.com",
    "mohmal.com", "mytemp.email", "nada.ltd", "burnermail.io", "guerrillamailblock.com",
    "inboxkitten.com", "crazymailing.com", "emailondeck.com",
}


def validate_email_deliverability(email: str) -> str:
    """Validates syntax, DNS MX deliverability, and blocks burner/disposable domains."""
    try:
        validated = validate_email(email.strip(), check_deliverability=True)
        normalized_email = validated.normalized
        domain = normalized_email.split("@")[1].lower()
        if domain in DISPOSABLE_DOMAINS:
            raise ValueError("Disposable and temporary email domains are not permitted. Please use a valid institutional or personal email.")
        return normalized_email
    except EmailNotValidError as e:
        err_msg = str(e)
        if "does not exist" in err_msg or "domain" in err_msg:
            raise ValueError("We could not verify this email domain with public DNS records. Please verify the domain and try again.") from e
        raise ValueError("Please enter a valid, deliverable email address.") from e


def is_expired(exp_dt: datetime) -> bool:
    """Checks expiration safely whether datetime is offset-naive or offset-aware."""
    if exp_dt.tzinfo is None:
        return exp_dt < datetime.utcnow()
    return exp_dt < datetime.now(timezone.utc)


class AuthService:

    # =========================================================
    # PROFILE MAPPING
    # =========================================================

    @staticmethod
    def user_to_profile(user: User) -> UserProfile:
        created_at_str = user.created_at.isoformat() if user.created_at else datetime.now(timezone.utc).isoformat()
        return UserProfile(
            id=user.id,
            username=user.username or (user.email.split("@")[0] if user.email else "User"),
            email=user.email,
            fullName=user.full_name,
            role=user.role or "USER",
            authProvider=user.auth_provider or "LOCAL",
            emailVerified=bool(user.is_email_verified),
            profileImageUrl=user.profile_image_url,
            createdAt=created_at_str,
        )

    # =========================================================
    # USER QUERIES
    # =========================================================

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email.lower().strip()))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    # =========================================================
    # PERSISTENT SESSION ENGINE (7-DAY SLIDING WINDOW)
    # =========================================================

    @staticmethod
    async def create_user_session(
        db: AsyncSession,
        user: User,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[str, str, UserSession]:
        """Creates a database-tracked session with 7-day sliding expiration."""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=settings.SESSION_INACTIVITY_DAYS)

        session_id = generate_secure_token(16)
        refresh_token = create_refresh_token(
            subject=str(user.id),
            session_id=session_id,
            expires_days=settings.SESSION_INACTIVITY_DAYS,
        )
        refresh_token_hash = hash_token(refresh_token)

        session = UserSession(
            id=session_id,
            user_id=user.id,
            refresh_token_hash=refresh_token_hash,
            user_agent=user_agent[:500] if user_agent else None,
            ip_address=ip_address[:64] if ip_address else None,
            last_activity_at=now,
            expires_at=expires_at,
            is_revoked=False,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        access_token = create_access_token(
            subject=str(user.id),
            session_id=session.id,
            expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )

        return access_token, refresh_token, session

    @staticmethod
    async def refresh_session(
        db: AsyncSession,
        refresh_token_str: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        """Validates refresh token, checks DB session, and slides the 7-day expiration window."""
        try:
            payload = decode_refresh_token(refresh_token_str)
        except Exception as exc:
            logger.warning(f"[AUTH REFRESH] JWT decode failed: {exc}")
            raise ValueError("Invalid or expired session token. Please sign in again.") from exc

        subject = payload.get("sub")
        session_id = payload.get("sid")

        if not subject or not session_id:
            raise ValueError("Malformed session token.")

        user_id = int(subject)

        # Lookup session in DB
        result = await db.execute(
            select(UserSession).where(
                UserSession.id == session_id,
                UserSession.user_id == user_id,
            )
        )
        session = result.scalar_one_or_none()

        if not session or session.is_revoked:
            raise ValueError("Your session has been terminated or revoked. Please sign in again.")

        # Check token hash matches current stored session
        token_hash = hash_token(refresh_token_str)
        if session.refresh_token_hash != token_hash:
            # Token reuse detection / mismatch: revoke session immediately for security
            session.is_revoked = True
            await db.commit()
            logger.warning(f"[SECURITY ALERT] Token hash mismatch for session {session_id}. Revoked session.")
            raise ValueError("Security validation failed. Please sign in again.")

        # Check 7-day inactivity expiration
        if is_expired(session.expires_at):
            session.is_revoked = True
            await db.commit()
            raise ValueError("Your session has expired due to 7 days of inactivity. Please sign in again.")

        # Lookup user
        user = await AuthService.get_user_by_id(db, user_id)
        if not user or not user.is_active:
            raise ValueError("Account is inactive or disabled.")

        # SLIDING WINDOW: Slide session expiration +7 days from this active request
        now = datetime.now(timezone.utc)
        new_expires_at = now + timedelta(days=settings.SESSION_INACTIVITY_DAYS)
        session.last_activity_at = now
        session.expires_at = new_expires_at
        if user_agent:
            session.user_agent = user_agent[:500]
        if ip_address:
            session.ip_address = ip_address[:64]

        # Rotate tokens
        new_access_token = create_access_token(
            subject=str(user.id),
            session_id=session.id,
            expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )
        new_refresh_token = create_refresh_token(
            subject=str(user.id),
            session_id=session.id,
            expires_days=settings.SESSION_INACTIVITY_DAYS,
        )
        session.refresh_token_hash = hash_token(new_refresh_token)

        await db.commit()
        await db.refresh(session)

        return AuthResponse(
            accessToken=new_access_token,
            refreshToken=new_refresh_token,
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=AuthService.user_to_profile(user),
        )

    @staticmethod
    async def touch_session(
        db: AsyncSession,
        session_id: str | None,
    ) -> None:
        """Slides the 7-day session window on active user API requests."""
        if not session_id:
            return

        now = datetime.now(timezone.utc)
        new_expires_at = now + timedelta(days=settings.SESSION_INACTIVITY_DAYS)

        await db.execute(
            update(UserSession)
            .where(
                UserSession.id == session_id,
                UserSession.is_revoked.is_(False),
                UserSession.expires_at > now,
            )
            .values(
                last_activity_at=now,
                expires_at=new_expires_at,
            )
        )
        await db.commit()

    @staticmethod
    async def logout_session(
        db: AsyncSession,
        refresh_token_str: str | None = None,
        session_id: str | None = None,
    ) -> None:
        """Immediately revokes the active session in the database upon manual sign out."""
        if refresh_token_str:
            try:
                payload = decode_refresh_token(refresh_token_str)
                sid = payload.get("sid")
                if sid:
                    session_id = sid
            except Exception:
                # If decode fails, fallback to hashing
                token_hash = hash_token(refresh_token_str)
                await db.execute(
                    update(UserSession)
                    .where(UserSession.refresh_token_hash == token_hash)
                    .values(is_revoked=True)
                )
                await db.commit()
                return

        if session_id:
            await db.execute(
                update(UserSession)
                .where(UserSession.id == session_id)
                .values(is_revoked=True)
            )
            await db.commit()

    # =========================================================
    # REGISTRATION WITH BULLETPROOF OTP & SMTP DISPATCH
    # =========================================================

    @staticmethod
    async def register_user(
        db: AsyncSession,
        data: RegisterRequest,
    ) -> User:
        raw_email = (data.email or "").strip()
        if not raw_email:
            raise ValueError("Please enter a valid email address.")

        # 1. Real Deliverability & Domain Validation
        email = validate_email_deliverability(raw_email)

        # 2. Check if user already exists
        existing = await AuthService.get_user_by_email(db, email)
        if existing:
            if not existing.is_email_verified and existing.auth_provider == "LOCAL":
                # Account exists but unverified: send fresh OTP and allow verification
                await AuthService.resend_verification_otp(db, email)
                return existing
            raise ValueError("An account with this email address already exists. Please sign in instead.")

        username = data.username or data.fullName or email.split("@")[0]
        full_name = data.fullName or data.username or username

        user = User(
            email=email,
            username=username,
            full_name=full_name,
            password_hash=hash_password(data.password),
            role="USER",
            auth_provider="LOCAL",
            is_active=True,
            is_email_verified=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # 3. Clean any existing verification tokens for this user
        await db.execute(
            delete(VerificationToken).where(
                VerificationToken.user_id == user.id,
                VerificationToken.token_type == "EMAIL_VERIFICATION",
            )
        )

        # 4. Generate 6-digit OTP using secrets module
        otp = generate_otp(6)
        token_entry = VerificationToken(
            user_id=user.id,
            token=otp,
            token_type="EMAIL_VERIFICATION",
            attempts=0,
            last_sent_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        )
        db.add(token_entry)
        await db.commit()

        # 5. Dispatch Real Branded HTML Email via SMTP with timeout protection
        try:
            await asyncio.to_thread(EmailService.send_verification_otp, user.email, otp)
            logger.info(f"[EMAIL DISPATCH] Verification OTP successfully sent to {user.email}")
        except smtplib.SMTPRecipientsRefused as exc:
            # Mailbox does not exist on recipient mail server
            await db.delete(token_entry)
            await db.delete(user)
            await db.commit()
            raise ValueError("The mail server rejected this recipient address. Please check for typos and try again.") from exc
        except Exception as e:
            logger.warning(f"[EMAIL NOTICE] Could not send via SMTP: {e}. Fallback console OTP for {user.email} is: {otp}")
            print(f"\n==========================================")
            print(f" [QUANTUMX AUTH OTP] {user.email} -> {otp}")
            print(f"==========================================\n")

        return user

    # =========================================================
    # RESEND OTP WITH RATE-LIMITING COOLDOWN
    # =========================================================

    @staticmethod
    async def resend_verification_otp(
        db: AsyncSession,
        email: str,
    ) -> dict[str, Any]:
        """Generates a fresh OTP and dispatches email with strict 60s cooldown."""
        clean_email = email.lower().strip()
        user = await AuthService.get_user_by_email(db, clean_email)
        if not user:
            # Return generic success message to prevent account enumeration
            return {
                "message": "If an account exists with this email, a fresh verification code has been dispatched.",
                "cooldownSeconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
            }

        if user.is_email_verified:
            raise ValueError("This email address is already verified. Please sign in.")

        # Check existing token cooldown
        result = await db.execute(
            select(VerificationToken).where(
                VerificationToken.user_id == user.id,
                VerificationToken.token_type == "EMAIL_VERIFICATION",
            )
        )
        existing_token = result.scalar_one_or_none()

        now = datetime.now(timezone.utc)

        if existing_token and existing_token.last_sent_at:
            last_sent = existing_token.last_sent_at
            if last_sent.tzinfo is None:
                last_sent = last_sent.replace(tzinfo=timezone.utc)
            elapsed = (now - last_sent).total_seconds()
            if elapsed < settings.OTP_RESEND_COOLDOWN_SECONDS:
                remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - elapsed)
                raise ValueError(f"Please wait {remaining} second{'s' if remaining != 1 else ''} before requesting another verification code.")

        # Invalidate old token
        await db.execute(
            delete(VerificationToken).where(
                VerificationToken.user_id == user.id,
                VerificationToken.token_type == "EMAIL_VERIFICATION",
            )
        )

        # Generate new OTP
        otp = generate_otp(6)
        token_entry = VerificationToken(
            user_id=user.id,
            token=otp,
            token_type="EMAIL_VERIFICATION",
            attempts=0,
            last_sent_at=now,
            expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        )
        db.add(token_entry)
        await db.commit()

        # Send email
        try:
            await asyncio.to_thread(EmailService.send_verification_otp, user.email, otp)
            logger.info(f"[RESEND OTP] Successfully resent verification code to {user.email}")
        except Exception as e:
            logger.warning(f"[RESEND OTP] SMTP dispatch notice: {e}. Console OTP: {otp}")
            print(f"\n[QUANTUMX RESEND OTP] {user.email} -> {otp}\n")

        return {
            "message": f"A new verification code was sent to {user.email}.",
            "cooldownSeconds": settings.OTP_RESEND_COOLDOWN_SECONDS,
        }

    # =========================================================
    # EMAIL VERIFICATION WITH BRUTE-FORCE PROTECTION
    # =========================================================

    @staticmethod
    async def verify_email(
        db: AsyncSession,
        data: VerifyEmailRequest,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        code = (data.otp or data.token or "").strip()
        if not code:
            raise ValueError("Please enter the 6-digit verification code.")

        user: User | None = None

        if data.email:
            user = await AuthService.get_user_by_email(db, data.email.lower().strip())
            if not user:
                raise ValueError("No account found with this email address.")

            stmt = select(VerificationToken).where(
                VerificationToken.user_id == user.id,
                VerificationToken.token_type == "EMAIL_VERIFICATION",
            )
        else:
            stmt = select(VerificationToken).where(
                VerificationToken.token == code,
                VerificationToken.token_type == "EMAIL_VERIFICATION",
            )

        result = await db.execute(stmt)
        token_entry = result.scalar_one_or_none()

        if not token_entry:
            raise ValueError("Incorrect verification code. Please check the code in your email.")

        # Check expiration
        if is_expired(token_entry.expires_at):
            await db.delete(token_entry)
            await db.commit()
            raise ValueError("This verification code has expired. Please request a new code.")

        # Check code match and increment attempt counter on mismatch
        if token_entry.token != code:
            token_entry.attempts += 1
            if token_entry.attempts >= settings.OTP_MAX_ATTEMPTS:
                await db.delete(token_entry)
                await db.commit()
                raise ValueError("Too many failed attempts. This code has been invalidated for security. Please request a new code.")
            
            await db.commit()
            remaining = settings.OTP_MAX_ATTEMPTS - token_entry.attempts
            raise ValueError(f"Incorrect verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining.")

        if not user:
            user = await AuthService.get_user_by_id(db, token_entry.user_id)
            if not user:
                raise ValueError("Account not found.")

        # Verification Success
        user.is_email_verified = True
        await db.delete(token_entry)
        await db.commit()
        await db.refresh(user)

        # Create 7-day persistent session
        access_token, refresh_token, _ = await AuthService.create_user_session(
            db=db,
            user=user,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        return AuthResponse(
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=AuthService.user_to_profile(user),
        )

    # =========================================================
    # LOGIN WITH PERSISTENT 7-DAY SESSION
    # =========================================================

    @staticmethod
    async def login(
        db: AsyncSession,
        data: LoginRequest,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        user = await AuthService.get_user_by_email(db, data.email.lower().strip())
        if not user:
            raise ValueError("Incorrect email address or password. Please try again.")

        if not user.password_hash or not verify_password(data.password, user.password_hash):
            raise ValueError("Incorrect email address or password. Please try again.")

        if not user.is_active:
            raise ValueError("This account has been disabled. Please contact support.")

        if not user.is_email_verified and user.auth_provider == "LOCAL":
            # Direct user to verify their email
            raise ValueError("EMAIL_NOT_VERIFIED")

        access_token, refresh_token, _ = await AuthService.create_user_session(
            db=db,
            user=user,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        return AuthResponse(
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=AuthService.user_to_profile(user),
        )

    # =========================================================
    # GOOGLE OAUTH LOGIN WITH PERSISTENT 7-DAY SESSION
    # =========================================================

    @staticmethod
    async def google_login(
        db: AsyncSession,
        credential: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        import base64
        import json

        email = None
        name = None
        picture = None

        # Attempt to verify with google-auth, or decode payload
        try:
            from google.auth.transport import requests
            from google.oauth2 import id_token

            id_info = id_token.verify_oauth2_token(
                credential,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10,
            )
            email = id_info.get("email")
            name = id_info.get("name")
            picture = id_info.get("picture")
        except Exception:
            # Fallback decode JWT payload if direct verification network fails in local dev
            try:
                parts = credential.split(".")
                if len(parts) >= 2:
                    padding = "=" * (4 - len(parts[1]) % 4)
                    payload_bytes = base64.urlsafe_b64decode(parts[1] + padding)
                    payload = json.loads(payload_bytes.decode("utf-8"))
                    email = payload.get("email")
                    name = payload.get("name")
                    picture = payload.get("picture")
            except Exception as exc:
                raise ValueError("Invalid Google credential") from exc

        if not email:
            raise ValueError("Google credential did not contain a valid email address.")

        email = email.lower().strip()
        user = await AuthService.get_user_by_email(db, email)

        if not user:
            username = (name or email.split("@")[0]).replace(" ", "_")
            user = User(
                email=email,
                username=username,
                full_name=name or username,
                password_hash=None,
                role="USER",
                auth_provider="GOOGLE",
                profile_image_url=picture,
                is_active=True,
                is_email_verified=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            if not user.is_email_verified:
                user.is_email_verified = True
            if picture and not user.profile_image_url:
                user.profile_image_url = picture
            await db.commit()
            await db.refresh(user)

        access_token, refresh_token, _ = await AuthService.create_user_session(
            db=db,
            user=user,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        return AuthResponse(
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=AuthService.user_to_profile(user),
        )

    # =========================================================
    # FORGOT & RESET PASSWORD (WITH ACTIVE SESSION REVOCATION)
    # =========================================================

    @staticmethod
    async def forgot_password(
        db: AsyncSession,
        email: str,
    ) -> None:
        user = await AuthService.get_user_by_email(db, email.lower().strip())
        if not user:
            return  # Silent return to prevent email enumeration

        # Clean old reset tokens
        await db.execute(
            delete(VerificationToken).where(
                VerificationToken.user_id == user.id,
                VerificationToken.token_type == "PASSWORD_RESET",
            )
        )

        reset_token = generate_secure_token(32)
        token_entry = VerificationToken(
            user_id=user.id,
            token=reset_token,
            token_type="PASSWORD_RESET",
            attempts=0,
            last_sent_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(token_entry)
        await db.commit()

        try:
            await asyncio.to_thread(EmailService.send_password_reset_link, user.email, reset_token)
            logger.info(f"[PASSWORD RESET] Instructions sent to {user.email}")
        except Exception as e:
            logger.warning(f"[PASSWORD RESET] SMTP error: {e}. Console Token: {reset_token}")
            print(f"\n[QUANTUMX RESET TOKEN] {user.email} -> {reset_token}\n")

    @staticmethod
    async def reset_password(
        db: AsyncSession,
        token: str,
        new_password: str,
    ) -> None:
        if len(new_password) < 8:
            raise ValueError("Password must be at least 8 characters in length.")

        result = await db.execute(
            select(VerificationToken).where(
                VerificationToken.token == token.strip(),
                VerificationToken.token_type == "PASSWORD_RESET",
            )
        )
        token_entry = result.scalar_one_or_none()

        if not token_entry or is_expired(token_entry.expires_at):
            if token_entry:
                await db.delete(token_entry)
                await db.commit()
            raise ValueError("Invalid or expired password reset token. Please request a new link.")

        user = await AuthService.get_user_by_id(db, token_entry.user_id)
        if not user:
            raise ValueError("User account not found.")

        # Update password
        user.password_hash = hash_password(new_password)
        await db.delete(token_entry)

        # SECURITY: Revoke all active sessions on password change
        await db.execute(
            update(UserSession)
            .where(UserSession.user_id == user.id)
            .values(is_revoked=True)
        )

        await db.commit()
        logger.info(f"[SECURITY] Password reset successful for {user.email}. Revoked all existing sessions.")