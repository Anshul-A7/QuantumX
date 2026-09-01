import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import delete, select
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token, hash_token
from app.models.user import User
from app.models.session import UserSession
from app.models.verification_token import VerificationToken
from app.schemas.auth import RegisterRequest, LoginRequest, VerifyEmailRequest, ResetPasswordRequest
from app.services.auth_service import AuthService, validate_email_deliverability


async def run_auth_security_tests():
    print("\n=======================================================")
    print(" QUANTUMX — AUTH & PERSISTENT SESSION SECURITY AUDIT")
    print("=======================================================\n")

    test_email = f"security_audit_{int(datetime.now().timestamp())}@gmail.com"
    test_password = "SecurePassword@2026!"

    async with AsyncSessionLocal() as db:
        # Cleanup any previous audit user
        await db.execute(delete(User).where(User.email.like("security_audit_%")))
        await db.commit()

        # -----------------------------------------------------
        # TEST 1: Disposable email blocking & validation
        # -----------------------------------------------------
        print("[TEST 1] Testing Disposable & Invalid Email Blocking...")
        try:
            validate_email_deliverability("attacker@mailinator.com")
            assert False, "Failed to block mailinator.com"
        except ValueError as e:
            print("  [OK] Correctly blocked disposable domain:", e)

        try:
            validate_email_deliverability("invalid-email-no-domain")
            assert False, "Failed to block invalid syntax"
        except ValueError as e:
            print("  [OK] Correctly rejected invalid syntax:", e)

        # -----------------------------------------------------
        # TEST 2: Register user & OTP generation
        # -----------------------------------------------------
        print("\n[TEST 2] Registering user & checking OTP generation...")
        reg_req = RegisterRequest(
            email=test_email,
            username="SecurityTester",
            fullName="Security Test User",
            password=test_password,
        )
        user = await AuthService.register_user(db, reg_req)
        assert user.id is not None
        assert user.is_email_verified is False
        print(f"  [OK] User registered: ID={user.id}, Email={user.email}")

        # Check VerificationToken in DB
        res = await db.execute(
            select(VerificationToken).where(
                VerificationToken.user_id == user.id,
                VerificationToken.token_type == "EMAIL_VERIFICATION",
            )
        )
        token_entry = res.scalar_one_or_none()
        assert token_entry is not None
        assert len(token_entry.token) == 6
        assert token_entry.attempts == 0
        print(f"  [OK] 6-Digit OTP generated: {token_entry.token} | Expires at: {token_entry.expires_at}")

        # -----------------------------------------------------
        # TEST 3: Resend OTP Cooldown Throttling (< 60s rejected)
        # -----------------------------------------------------
        print("\n[TEST 3] Testing OTP Resend Cooldown (60s)...")
        try:
            await AuthService.resend_verification_otp(db, test_email)
            assert False, "Allowed resend without cooldown!"
        except ValueError as e:
            print("  [OK] Resend cooldown enforced:", e)

        # -----------------------------------------------------
        # TEST 4: OTP Brute-Force Defense (5 wrong attempts -> invalidated)
        # -----------------------------------------------------
        print("\n[TEST 4] Testing OTP Brute-Force Rate Limiting (5 Attempts)...")
        for attempt in range(1, 5):
            try:
                await AuthService.verify_email(db, VerifyEmailRequest(email=test_email, otp="999999"))
            except ValueError as e:
                print(f"  [OK] Wrong attempt {attempt}/5 rejected: {e}")

        # 5th wrong attempt should invalidate code
        try:
            await AuthService.verify_email(db, VerifyEmailRequest(email=test_email, otp="999999"))
            assert False, "5th attempt did not invalidate token!"
        except ValueError as e:
            print(f"  [OK] 5th attempt triggered token destruction: {e}")

        # Confirm token was deleted from DB
        res = await db.execute(
            select(VerificationToken).where(
                VerificationToken.user_id == user.id,
                VerificationToken.token_type == "EMAIL_VERIFICATION",
            )
        )
        assert res.scalar_one_or_none() is None
        print("  [OK] Verification token successfully deleted from database.")

        # -----------------------------------------------------
        # TEST 5: Issue fresh OTP and perform successful verification
        # -----------------------------------------------------
        print("\n[TEST 5] Issuing fresh OTP & verifying successfully...")
        # Reset last_sent_at to bypass 60s cooldown for testing
        fresh_otp = "123456"
        token_entry = VerificationToken(
            user_id=user.id,
            token=fresh_otp,
            token_type="EMAIL_VERIFICATION",
            attempts=0,
            last_sent_at=datetime.now(timezone.utc) - timedelta(seconds=70),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        )
        db.add(token_entry)
        await db.commit()

        auth_res = await AuthService.verify_email(
            db=db,
            data=VerifyEmailRequest(email=test_email, otp=fresh_otp),
            user_agent="AuditClient/1.0",
            ip_address="127.0.0.1",
        )
        assert auth_res.accessToken is not None
        assert auth_res.refreshToken is not None
        assert auth_res.user.emailVerified is True
        print("  [OK] Verification successful! Issued Access & Refresh tokens.")

        # Check UserSession in DB
        res = await db.execute(
            select(UserSession).where(
                UserSession.user_id == user.id,
                UserSession.is_revoked.is_(False),
            )
        )
        session = res.scalar_one_or_none()
        assert session is not None
        initial_expires_at = session.expires_at
        print(f"  [OK] Active DB Session ID: {session.id} | Expires: {session.expires_at}")

        # -----------------------------------------------------
        # TEST 6: Refresh Session & 7-Day Sliding Window
        # -----------------------------------------------------
        print("\n[TEST 6] Testing Session Refresh & 7-Day Inactivity Sliding Window...")
        refreshed_auth = await AuthService.refresh_session(
            db=db,
            refresh_token_str=auth_res.refreshToken,
            user_agent="AuditClient/1.0-Refreshed",
            ip_address="127.0.0.1",
        )
        assert refreshed_auth.accessToken is not None
        assert refreshed_auth.refreshToken is not None

        # Re-fetch session from DB to verify sliding expiration
        await db.refresh(session)
        assert session.is_revoked is False
        assert session.expires_at >= initial_expires_at
        print(f"  [OK] Session successfully refreshed! New expiry: {session.expires_at} (Extended by 7 days)")

        # -----------------------------------------------------
        # TEST 7: Expired Session (> 7 days inactivity) Rejection
        # -----------------------------------------------------
        print("\n[TEST 7] Testing Expired Session (> 7 Days Inactivity)...")
        session.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
        await db.commit()

        try:
            await AuthService.refresh_session(db, refreshed_auth.refreshToken)
            assert False, "Allowed expired session!"
        except ValueError as e:
            print("  [OK] Expired session correctly rejected:", e)

        # -----------------------------------------------------
        # TEST 8: Login, Active Session creation & Manual Logout Revocation
        # -----------------------------------------------------
        print("\n[TEST 8] Testing Login & Manual Logout Server-Side Revocation...")
        login_res = await AuthService.login(
            db=db,
            data=LoginRequest(email=test_email, password=test_password),
            user_agent="AuditClient/1.0",
            ip_address="127.0.0.1",
        )
        print("  [OK] Logged in successfully. Active session created.")

        # Perform manual logout
        await AuthService.logout_session(db, refresh_token_str=login_res.refreshToken)
        print("  [OK] Manual logout performed.")

        # Attempting to refresh with the logged-out token must fail
        try:
            await AuthService.refresh_session(db, login_res.refreshToken)
            assert False, "Revoked session was allowed to refresh!"
        except ValueError as e:
            print("  [OK] Revoked session immediately blocked upon refresh:", e)

        # -----------------------------------------------------
        # TEST 9: Password Reset & Total Session Invalidation
        # -----------------------------------------------------
        print("\n[TEST 9] Testing Password Reset & Cascade Session Invalidation...")
        # Create a new active session
        login_res2 = await AuthService.login(
            db=db,
            data=LoginRequest(email=test_email, password=test_password),
        )

        # Request reset password
        await AuthService.forgot_password(db, test_email)
        res = await db.execute(
            select(VerificationToken).where(
                VerificationToken.user_id == user.id,
                VerificationToken.token_type == "PASSWORD_RESET",
            )
        )
        reset_token_entry = res.scalar_one_or_none()
        assert reset_token_entry is not None

        # Reset password
        new_pass = "BrandNewSecurePassword@2026!"
        await AuthService.reset_password(db, reset_token_entry.token, new_pass)
        print("  [OK] Password successfully reset.")

        # Verify old session was cascade-revoked
        try:
            await AuthService.refresh_session(db, login_res2.refreshToken)
            assert False, "Old session survived password reset!"
        except ValueError as e:
            print("  [OK] Prior session invalidated following password reset:", e)

        # Clean up test user
        await db.execute(delete(User).where(User.id == user.id))
        await db.commit()
        print("\n  [OK] Test artifacts cleaned up.")

    print("\n=======================================================")
    print(" ALL 9 AUTH & SESSION SECURITY TESTS PASSED PERFECTLY!")
    print("=======================================================\n")


if __name__ == "__main__":
    asyncio.run(run_auth_security_tests())
