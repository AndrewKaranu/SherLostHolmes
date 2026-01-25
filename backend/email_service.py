"""
Email Service for SherLostHolmes

Handles sending notification emails for:
- Match approval (with pickup instructions)
- Match denial
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Email configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@sherlostholmes.com")
FROM_NAME = os.getenv("FROM_NAME", "SherLostHolmes")


def send_email(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> dict:
    """
    Send an email using SMTP.
    Returns status dict with success/error.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        # If no SMTP config, log and return (for development)
        print(f"[EMAIL] Would send to {to_email}: {subject}")
        print(f"[EMAIL] Body: {text_body or html_body}")
        return {"status": "skipped", "message": "SMTP not configured", "to": to_email}

    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email

        # Attach text and HTML parts
        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        # Send via SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        return {"status": "success", "message": "Email sent", "to": to_email}

    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {str(e)}")
        return {"status": "error", "message": str(e), "to": to_email}


def send_approval_email(
    to_email: str,
    item_name: str,
    locker_number: int,
    locker_location: str,
    password: str,
    claimant_name: Optional[str] = None
) -> dict:
    """
    Send approval email with pickup instructions.
    """
    name = claimant_name or "Detective"

    subject = f"Case Closed! Your {item_name} is Ready for Pickup"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Georgia', serif; background-color: #F5F1E1; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border: 4px solid #4E342E; padding: 30px; }}
            .header {{ text-align: center; border-bottom: 3px double #912338; padding-bottom: 20px; margin-bottom: 20px; }}
            .logo {{ color: #912338; font-size: 28px; font-weight: bold; letter-spacing: 2px; }}
            .logo span {{ color: #000; }}
            .success-badge {{ background: #4CAF50; color: white; padding: 10px 20px; display: inline-block; font-weight: bold; text-transform: uppercase; margin: 20px 0; }}
            .details {{ background: #F5F1E1; padding: 20px; margin: 20px 0; border-left: 4px solid #EBAF33; }}
            .code-box {{ background: #912338; color: white; text-align: center; padding: 20px; margin: 20px 0; }}
            .code {{ font-size: 36px; font-weight: bold; letter-spacing: 10px; font-family: monospace; }}
            .location {{ background: #4E342E; color: white; padding: 15px; text-align: center; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
            .warning {{ color: #912338; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SHER<span>LOST</span>HOLMES</div>
                <p style="color: #912338; margin: 5px 0;">Concordia Bureau of Missing Items</p>
            </div>

            <div class="success-badge">CASE CLOSED - MATCH CONFIRMED</div>

            <p>Dear {name},</p>

            <p>Excellent detective work! Your claim for <strong>{item_name}</strong> has been verified and approved by our investigators.</p>

            <div class="details">
                <h3 style="margin-top: 0; color: #4E342E;">Pickup Details</h3>
                <p><strong>Item:</strong> {item_name}</p>
                <p><strong>Locker Number:</strong> #{locker_number}</p>
            </div>

            <div class="location">
                <p style="margin: 0; font-size: 14px; opacity: 0.8;">PICKUP LOCATION</p>
                <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">{locker_location}</p>
            </div>

            <div class="code-box">
                <p style="margin: 0; font-size: 14px; opacity: 0.8;">YOUR ACCESS CODE</p>
                <div class="code">{password}</div>
                <p style="margin: 10px 0 0; font-size: 12px;">Enter this code on the locker keypad</p>
            </div>

            <p class="warning">Important Instructions:</p>
            <ol>
                <li>Go to {locker_location} during operating hours (8 AM - 10 PM)</li>
                <li>Locate Locker #{locker_number}</li>
                <li>Enter your 4-digit code: <strong>{password}</strong></li>
                <li>Retrieve your item and close the locker</li>
            </ol>

            <p>Your code is valid for <strong>7 days</strong>. If not collected within this period, the item may be returned to the evidence room.</p>

            <p>Thank you for trusting SherLostHolmes to reunite you with your belongings!</p>

            <div class="footer">
                <p>Concordia University Lost & Found</p>
                <p>Est. 1887</p>
                <p style="font-size: 10px; color: #999;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_body = f"""
SHERLOSTHOLMES - CASE CLOSED

Dear {name},

Your claim for {item_name} has been verified and approved!

PICKUP DETAILS:
- Item: {item_name}
- Locker Number: #{locker_number}
- Location: {locker_location}
- Access Code: {password}

INSTRUCTIONS:
1. Go to {locker_location} during operating hours (8 AM - 10 PM)
2. Locate Locker #{locker_number}
3. Enter your 4-digit code: {password}
4. Retrieve your item and close the locker

Your code is valid for 7 days.

Thank you for using SherLostHolmes!

---
Concordia University Lost & Found
Est. 1887
    """

    return send_email(to_email, subject, html_body, text_body)


def send_denial_email(
    to_email: str,
    item_name: str,
    reason: Optional[str] = None,
    claimant_name: Optional[str] = None
) -> dict:
    """
    Send denial email when match is rejected.
    """
    name = claimant_name or "Detective"
    denial_reason = reason or "The evidence provided did not sufficiently match the item records."

    subject = f"Match Review Update - {item_name}"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Georgia', serif; background-color: #F5F1E1; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border: 4px solid #4E342E; padding: 30px; }}
            .header {{ text-align: center; border-bottom: 3px double #912338; padding-bottom: 20px; margin-bottom: 20px; }}
            .logo {{ color: #912338; font-size: 28px; font-weight: bold; letter-spacing: 2px; }}
            .logo span {{ color: #000; }}
            .status-badge {{ background: #666; color: white; padding: 10px 20px; display: inline-block; font-weight: bold; text-transform: uppercase; margin: 20px 0; }}
            .reason-box {{ background: #F5F1E1; padding: 20px; margin: 20px 0; border-left: 4px solid #912338; }}
            .cta {{ background: #912338; color: white; padding: 15px 30px; text-decoration: none; display: inline-block; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">SHER<span>LOST</span>HOLMES</div>
                <p style="color: #912338; margin: 5px 0;">Concordia Bureau of Missing Items</p>
            </div>

            <div class="status-badge">MATCH NOT CONFIRMED</div>

            <p>Dear {name},</p>

            <p>Thank you for submitting your claim for <strong>{item_name}</strong>. After careful review by our investigators, we were unable to confirm a match at this time.</p>

            <div class="reason-box">
                <h3 style="margin-top: 0; color: #4E342E;">Review Notes</h3>
                <p>{denial_reason}</p>
            </div>

            <p><strong>What you can do:</strong></p>
            <ul>
                <li>Review your item description and try again with more details</li>
                <li>Check back regularly as new items are added to our database</li>
                <li>Visit the Security desk in person for additional assistance</li>
            </ul>

            <p style="text-align: center;">
                <a href="https://sherlostholmes.com/evidence" class="cta">Submit New Evidence</a>
            </p>

            <p>We understand how frustrating it can be to lose a valued item. Our team is here to help, and we encourage you to keep searching.</p>

            <div class="footer">
                <p>Concordia University Lost & Found</p>
                <p>Est. 1887</p>
                <p style="font-size: 10px; color: #999;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_body = f"""
SHERLOSTHOLMES - MATCH REVIEW UPDATE

Dear {name},

Thank you for submitting your claim for {item_name}. After careful review by our investigators, we were unable to confirm a match at this time.

REVIEW NOTES:
{denial_reason}

WHAT YOU CAN DO:
- Review your item description and try again with more details
- Check back regularly as new items are added to our database
- Visit the Security desk in person for additional assistance

We encourage you to keep searching for your item.

---
Concordia University Lost & Found
Est. 1887
    """

    return send_email(to_email, subject, html_body, text_body)
