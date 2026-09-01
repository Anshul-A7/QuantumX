import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("email_service")


class EmailService:

    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: str | None = None,
    ) -> None:
        """Sends an email using configured SMTP host with strict 10s connection timeout."""
        message = EmailMessage()

        message["From"] = settings.EMAIL_FROM
        message["To"] = to_email
        message["Subject"] = subject

        message.set_content(body)
        if html_body:
            message.add_alternative(html_body, subtype="html")

        try:
            with smtplib.SMTP(
                host=settings.EMAIL_HOST,
                port=settings.EMAIL_PORT,
                timeout=10.0,
            ) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(
                    settings.EMAIL_USERNAME,
                    settings.EMAIL_PASSWORD,
                )
                server.send_message(message)
                logger.info(f"[SMTP DISPATCH] Successfully delivered email to {to_email} | Subject: '{subject}'")
        except Exception as exc:
            logger.error(f"[SMTP FAILURE] Failed to deliver email to {to_email}: {exc}")
            raise exc

    @staticmethod
    def send_verification_otp(
        to_email: str,
        otp: str,
    ) -> None:
        """Sends a branded HTML verification email with 6-digit OTP."""
        subject = f"QuantumX — Verification Code: {otp}"

        text_body = f"""Hello,

Your QuantumX verification code is: {otp}

This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes.

If you did not request this verification, you can safely ignore this email.

Best regards,
The QuantumX Engineering Team
"""

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; }}
    .container {{ max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e3dc; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }}
    .logo {{ font-size: 20px; font-weight: 700; color: #111111; letter-spacing: -0.5px; margin-bottom: 24px; }}
    .title {{ font-size: 24px; font-weight: 600; color: #111111; margin-bottom: 12px; }}
    .desc {{ font-size: 15px; color: #555555; line-height: 1.5; margin-bottom: 28px; }}
    .otp-box {{ background-color: #f4f3ee; border: 1px solid #dcdad2; border-radius: 12px; padding: 18px; text-align: center; font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111111; margin-bottom: 28px; }}
    .footer {{ font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 18px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">QuantumX <span style="font-size: 12px; font-weight: 400; color: #0070f3; text-transform: uppercase; letter-spacing: 1px;">Platform</span></div>
    <div class="title">Verify Your Institutional Identity</div>
    <div class="desc">Please use the verification code below to confirm your account and grant access to the hybrid quantum diagnostic engine.</div>
    <div class="otp-box">{otp}</div>
    <div class="desc" style="font-size: 13px; color: #777;">This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes. Never share this code with anyone.</div>
    <div class="footer">QuantumX — NISQ-Optimized Hybrid Classical-Quantum Diagnostics</div>
  </div>
</body>
</html>
"""

        EmailService.send_email(
            to_email=to_email,
            subject=subject,
            body=text_body,
            html_body=html_body,
        )

    @staticmethod
    def send_password_reset_link(
        to_email: str,
        token: str,
    ) -> None:
        """Sends password reset link & token."""
        subject = "QuantumX — Password Reset Instructions"
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        text_body = f"""Hello,

A password reset request was initiated for your QuantumX account.

To reset your password, visit the link below:
{reset_link}

Alternatively, use your reset token directly:
{token}

This link is valid for 1 hour. If you did not request this, please ignore this email.

Best regards,
The QuantumX Engineering Team
"""

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; }}
    .container {{ max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e3dc; border-radius: 16px; padding: 36px; }}
    .logo {{ font-size: 20px; font-weight: 700; color: #111111; margin-bottom: 24px; }}
    .title {{ font-size: 22px; font-weight: 600; color: #111111; margin-bottom: 12px; }}
    .desc {{ font-size: 15px; color: #555555; line-height: 1.5; margin-bottom: 24px; }}
    .btn {{ display: inline-block; background-color: #111111; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; margin-bottom: 24px; }}
    .token-box {{ background-color: #f4f3ee; border: 1px solid #dcdad2; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 14px; word-break: break-all; margin-bottom: 24px; }}
    .footer {{ font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 18px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">QuantumX</div>
    <div class="title">Reset Your Research Passkey</div>
    <div class="desc">A password reset request was initiated for your QuantumX workspace. Click the button below to choose a new password:</div>
    <a href="{reset_link}" class="btn" target="_blank">Reset My Password</a>
    <div class="desc" style="font-size: 13px; color: #777;">If the button above does not work, copy and paste this token into the reset form:</div>
    <div class="token-box">{token}</div>
    <div class="desc" style="font-size: 13px; color: #777;">This request is valid for 1 hour. If you did not make this request, you can safely ignore this email.</div>
    <div class="footer">QuantumX — Translational Oncology & Quantum ML</div>
  </div>
</body>
</html>
"""

        EmailService.send_email(
            to_email=to_email,
            subject=subject,
            body=text_body,
            html_body=html_body,
        )