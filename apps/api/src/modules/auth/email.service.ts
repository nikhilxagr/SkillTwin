import { config } from "../../config.js";
import pino from "pino";

const logger = pino();

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  type: "verification" | "password_reset";
  token: string;
  link: string;
  sentAt: Date;
}

export class EmailService {
  // Store sent emails in memory for development & testing inspection
  private sentEmails: SentEmailRecord[] = [];

  getLatestEmailFor(email: string): SentEmailRecord | undefined {
    return this.sentEmails
      .slice()
      .reverse()
      .find((e) => e.to.toLowerCase() === email.toLowerCase());
  }

  getAllSentEmails(): SentEmailRecord[] {
    return [...this.sentEmails];
  }

  clear(): void {
    this.sentEmails = [];
  }

  /**
   * Send SkillTwin Email Verification
   */
  async sendVerificationEmail(toEmail: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `${config.WEB_ORIGIN}/#/verify-email?token=${token}`;
    const subject = "SkillTwin — Confirm your email address";

    const textContent = `
Hello ${name},

Confirm your email address to activate your SkillTwin account.

Verification link:
${verificationUrl}

This link will expire in 24 hours and can only be used once.

Security Notice:
If you did not create a SkillTwin account, please safely ignore this email.

— The SkillTwin Team
support@skilltwin.dev
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .header { padding: 28px 32px 20px; border-bottom: 1px solid #f1f5f9; }
    .brand { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .brand span { color: #2563eb; }
    .content { padding: 32px; }
    h1 { font-size: 19px; font-weight: 700; color: #0f172a; margin-top: 0; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 16px 0; }
    .button-wrap { margin: 28px 0; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 26px; border-radius: 8px; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b; line-height: 1.5; }
    .token-url { font-family: monospace; font-size: 11px; word-break: break-all; color: #64748b; background: #f1f5f9; padding: 8px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Skill<span>Twin</span></div>
    </div>
    <div class="content">
      <h1>Verify your email address</h1>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Confirm your email address to activate your SkillTwin developer profile and unlock your AI Career Twin.</p>
      <div class="button-wrap">
        <a href="${verificationUrl}" class="btn" target="_blank">Verify Email</a>
      </div>
      <p style="font-size: 12.5px; color: #64748b;">
        This verification link expires in <strong>24 hours</strong> and can only be used once.
      </p>
      <p style="font-size: 12px; color: #94a3b8;">
        If button doesn't work, copy and paste this link in your browser:
      </p>
      <div class="token-url">${verificationUrl}</div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">Need help? Contact support@skilltwin.dev</p>
      <p style="margin: 0;">Security Note: If you didn't create a SkillTwin account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
`.trim();

    const record: SentEmailRecord = {
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to: toEmail,
      subject,
      type: "verification",
      token,
      link: verificationUrl,
      sentAt: new Date(),
    };

    this.sentEmails.push(record);

    logger.info(
      {
        to: toEmail,
        type: "verification",
        link: verificationUrl,
      },
      "Email verification link generated (Development Mode)"
    );

    return true;
  }

  /**
   * Send Password Reset Email
   */
  async sendPasswordResetEmail(toEmail: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${config.WEB_ORIGIN}/#/reset-password?token=${token}`;
    const subject = "SkillTwin — Password Reset Request";

    const record: SentEmailRecord = {
      id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to: toEmail,
      subject,
      type: "password_reset",
      token,
      link: resetUrl,
      sentAt: new Date(),
    };

    this.sentEmails.push(record);

    logger.info(
      {
        to: toEmail,
        type: "password_reset",
        link: resetUrl,
      },
      "Password reset link generated (Development Mode)"
    );

    return true;
  }
}

export const emailService = new EmailService();
