import random
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def generate_otp(length=6):
    """Generates a random numerical OTP string."""
    return ''.join(str(random.randint(0, 9)) for _ in range(length))

def send_otp_email(receiver_email, otp):
    """Sends the OTP to the specified email using SMTP."""
    sender_email = os.environ.get("SMTP_USER")
    sender_password = os.environ.get("SMTP_PASS")
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))

    if not sender_email or not sender_password:
        print(f"⚠️ SMTP credentials not set. DEV MODE OTP for {receiver_email} is: {otp}")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Password Reset OTP - AgroMarket"
    message["From"] = sender_email
    message["To"] = receiver_email

    text = f"Your One-Time Password (OTP) for changing your password is: {otp}\n\nDo not share this with anyone. It is valid for 10 minutes."
    part = MIMEText(text, "plain")
    message.attach(part)

    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
            server.login(sender_email, sender_password)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            
        server.sendmail(sender_email, receiver_email, message.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False