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

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- HEADER: Brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <div style="width:40px;height:40px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                        <span style="color:#fff;font-size:20px;font-weight:900;line-height:40px;display:block;text-align:center;">S</span>
                      </div>
                      <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;">Skill<span style="color:#60a5fa;">Twin</span></span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid #334155;">

              <!-- Gradient top bar -->
              <div style="height:4px;background:linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6);"></div>

              <!-- Card body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px 28px;">

                    <!-- Status badge -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);border-radius:100px;padding:5px 14px;">
                          <span style="color:#60a5fa;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">&#9679; Email Verification</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Headline -->
                    <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#f1f5f9;letter-spacing:-0.02em;line-height:1.2;">Verify your email address</h1>
                    <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.6;">Hey <strong style="color:#e2e8f0;">${name}</strong> 👋 — Welcome to SkillTwin! Use the code below to activate your developer account.</p>

                    <!-- OTP Display -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.1));border:1px solid rgba(99,102,241,0.3);border-radius:16px;padding:32px 24px;text-align:center;">

                          <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#64748b;">Your One-Time Code</p>

                          <!-- Individual digit boxes -->
                          <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                            <tr>
                              ${otp.split("").map(digit => `<td style="width:52px;height:64px;background:#0f172a;border:2px solid #3b82f6;border-radius:12px;margin:0 4px;text-align:center;vertical-align:middle;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:900;color:#60a5fa;letter-spacing:0;padding:0 4px;">${digit}</td>`).join("")}
                            </tr>
                          </table>

                          <p style="margin:0;font-size:12px;color:#64748b;">
                            &#9201; Expires in <strong style="color:#f59e0b;">10 minutes</strong> &nbsp;&bull;&nbsp; Single-use only
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Instructions -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                      <tr>
                        <td style="background:rgba(248,250,252,0.04);border-radius:12px;padding:20px 24px;">
                          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.05em;">How to verify:</p>
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding:5px 0;font-size:13px;color:#94a3b8;">
                                <span style="color:#3b82f6;font-weight:700;margin-right:10px;">1.</span>Return to the SkillTwin verification screen
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:5px 0;font-size:13px;color:#94a3b8;">
                                <span style="color:#3b82f6;font-weight:700;margin-right:10px;">2.</span>Enter the 6-digit code shown above
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:5px 0;font-size:13px;color:#94a3b8;">
                                <span style="color:#3b82f6;font-weight:700;margin-right:10px;">3.</span>Your account will be activated instantly
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Security Warning -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px 18px;">
                          <p style="margin:0;font-size:12px;color:#fbbf24;line-height:1.6;">
                            <strong>&#9888; Security Notice:</strong> SkillTwin will never ask you to share this code. If you didn't create an account, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:28px 16px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#475569;">
                Sent to <span style="color:#94a3b8;">${toEmail}</span> &middot; <a href="https://yourskilltwin.vercel.app" style="color:#3b82f6;text-decoration:none;">yourskilltwin.vercel.app</a>
              </p>
              <p style="margin:0;font-size:11px;color:#334155;">
                &copy; 2026 SkillTwin &mdash; AI Developer Career Intelligence Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

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
