"""
Simple SMTP Email Sender Module
Easy to use - just call send_verification_code with recipient and code
"""
import smtplib
import random
import os
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 465))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")

def generate_otp():
    """Generates a secure 6-digit numeric OTP."""
    return str(random.randint(100000, 999999))

def send_otp_email(receiver_email, otp):
    """
    Sends an OTP email to the user using SMTP_SSL.
    Requires SMTP_USER and SMTP_PASS to be set in the .env file.
    """
    if not SMTP_USER or not SMTP_PASS:
        print(f"SMTP credentials missing in .env. DEBUG OTP for {receiver_email}: {otp}")
        return False

    try:
        msg = MIMEText(f"Your AI Farmer verification code is: {otp}\n\nThis code is required to reset your password. If you did not request this, please ignore this email.")
        msg['Subject'] = 'AI Farmer Password Reset OTP'
        msg['From'] = f"AI Farmer Support <{SMTP_USER}>"
        msg['To'] = receiver_email

        # Using SMTP_SSL for secure connection on port 465
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
            print(f"Successfully sent OTP to {receiver_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False