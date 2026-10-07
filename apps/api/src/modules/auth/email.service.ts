import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../../config.js";
import pino from "pino";

const logger = pino();

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  type: "verification" | "verification_otp" | "password_reset";
  otp?: string;
  token?: string;
  link?: string;
  sentAt: Date;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private sentEmails: SentEmailRecord[] = [];

  constructor() {
    this.initTransporter();
  }

  /**
   * Initializes the Nodemailer transporter based on SMTP configuration.
   */
  private initTransporter(): void {
    if (config.SMTP_USER && config.SMTP_PASS) {
      const isGmail = config.SMTP_USER.includes("@gmail.com") || config.SMTP_HOST === "smtp.gmail.com";

      if (isGmail) {
        this.transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
          },
        });
      } else {
        const host = config.SMTP_HOST || "smtp.mailgun.org";
        const port = config.SMTP_PORT || (config.SMTP_SECURE ? 465 : 587);

        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: config.SMTP_SECURE || port === 465,
          auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
      }

      logger.info(
        { user: config.SMTP_USER, mode: isGmail ? "gmail" : "smtp" },
        "[EmailService] Nodemailer SMTP transporter initialized"
      );
    } else {
      logger.warn(
        "[EmailService] No SMTP_USER / SMTP_PASS provided in .env. Emails will be logged to console and stored in memory for testing."
      );
    }
  }

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
   * Send SkillTwin 6-digit OTP Email Verification via Nodemailer
   */
  async sendVerificationOtpEmail(toEmail: string, name: string, otp: string, token?: string): Promise<boolean> {
    const subject = `Your SkillTwin Verification Code: ${otp}`;
    const fromAddress = config.EMAIL_FROM || "SkillTwin <noreply@skilltwin.dev>";

    const textContent = `
Hello ${name},

Your 6-digit email verification code for SkillTwin is:

${otp}

This code will expire in 10 minutes. Enter this code on the verification screen to activate your SkillTwin developer profile.

Security Notice:
If you did not request this verification code, please ignore this email.

— The SkillTwin Team
support@skilltwin.dev
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { padding: 28px 32px 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
    .brand { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .brand span { color: #2563eb; }
    .content { padding: 36px 32px; }
    h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }
    .otp-box { margin: 28px 0; background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 12px; padding: 20px; text-align: center; }
    .otp-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; margin: 0; }
    .otp-label { font-size: 11px; text-transform: uppercase; tracking-wider; font-weight: 700; color: #64748b; margin-top: 6px; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #64748b; line-height: 1.5; }
    .badge { display: inline-block; padding: 4px 10px; background: #dbeafe; color: #1e40af; border-radius: 6px; font-size: 11px; font-weight: 600; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Skill<span>Twin</span></div>
    </div>
    <div class="content">
      <div class="badge">Verification Required</div>
      <h1>Verify your email address</h1>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Enter the following 6-digit verification code to confirm your email and activate your developer account:</p>
      
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-label">Single-Use Verification Code</div>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        ⏱️ This code expires in <strong>10 minutes</strong> and can only be used once.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">Need assistance? Contact support@skilltwin.dev</p>
      <p style="margin: 0;">Security note: Never share this OTP code with anyone. SkillTwin will never ask for your code.</p>
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
      otp,
      token,
      sentAt: new Date(),
    };
    this.sentEmails.push(record);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent,
        });

        logger.info(
          { to: toEmail, subject },
          "[EmailService] Real email sent successfully via Nodemailer SMTP"
        );
        return true;
      } catch (err: any) {
        logger.error(
          { err: err.message, to: toEmail },
          "[EmailService] Failed to send email via SMTP, falling back to local log"
        );
      }
    }

    // Prominent terminal notification if SMTP is not configured
    console.log("\n=======================================================");
    console.log(" 📧 [SKILLTWIN NODEMAILER SIMULATION - NO SMTP CREDENTIALS]");
    console.log(` To:      ${toEmail} (${name})`);
    console.log(` Subject: ${subject}`);
    console.log(` 🔑 OTP CODE: [ ${otp} ] (Valid for 10 minutes)`);
    console.log(" To send real emails, set SMTP_USER and SMTP_PASS in .env");
    console.log("=======================================================\n");

    return true;
  }

  /**
   * Send Password Reset Email via Nodemailer
   */
  async sendPasswordResetEmail(toEmail: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${config.WEB_ORIGIN}/#/reset-password?token=${token}`;
    const subject = "SkillTwin — Password Reset Request";
    const fromAddress = config.EMAIL_FROM || "SkillTwin <noreply@skilltwin.dev>";

    const textContent = `
Hello ${name},

You requested to reset your password for SkillTwin.

Reset link:
${resetUrl}

This link is valid for 1 hour.

If you did not request this, you can safely ignore this email.

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
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .header { padding: 24px 32px 18px; border-bottom: 1px solid #f1f5f9; }
    .brand { font-size: 20px; font-weight: 800; color: #0f172a; }
    .brand span { color: #2563eb; }
    .content { padding: 32px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">Skill<span>Twin</span></div>
    </div>
    <div class="content">
      <h2>Reset your password</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      <p style="font-size: 12px; color: #64748b;">This link will expire in 1 hour.</p>
    </div>
  </div>
</body>
</html>
`.trim();

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

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent,
        });
        return true;
      } catch (err: any) {
        logger.error({ err: err.message }, "[EmailService] Failed to send password reset email via SMTP");
      }
    }

    return true;
  }
}

export const emailService = new EmailService();
