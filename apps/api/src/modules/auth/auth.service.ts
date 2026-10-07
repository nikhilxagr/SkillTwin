import crypto from "node:crypto";
import { config } from "../../config.js";
import { dbService } from "../database/database.service.js";
import type { UserDoc, OAuthProviderType } from "../database/database.types.js";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  createSessionJwt,
  toSafeUser,
} from "./auth.security.js";
import { emailService } from "./email.service.js";
import type {
  SignupRequest,
  LoginRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  SafeUser,
  AuthResponse,
} from "@skilltwin/contracts";

export interface LoginResult {
  success: boolean;
  message: string;
  user?: SafeUser;
  token?: string;
  requiresVerification?: boolean;
  email?: string;
}

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export class AuthService {
  /**
   * Register a new user with unverified email and send 6-digit OTP via Nodemailer
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const normalizedEmail = data.email.trim().toLowerCase();

    // Check for existing user
    const existing = await dbService.users.findOne({ email: normalizedEmail });
    if (existing) {
      return {
        success: false,
        message: "An account with this email address already exists. Please sign in or reset your password.",
      };
    }

    const passwordHash = await hashPassword(data.password);
    const { rawToken, hashedToken } = generateSecureToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate 6-digit OTP
    const otp = generateOtp();
    const otpHashed = hashToken(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const userId = `usr-${crypto.randomUUID()}`;

    const newUser: UserDoc = {
      _id: userId,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      emailVerifiedAt: null,
      verificationTokenHash: hashedToken,
      verificationTokenExpiresAt: tokenExpiresAt,
      verificationOtpHash: otpHashed,
      verificationOtpExpiresAt: otpExpiresAt,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
      avatarUrl: "",
      profile: {
        headline: "",
        targetRole: "Full Stack Developer",
        bio: "",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    await dbService.users.insertOne(newUser);

    // Send 6-digit OTP email via Nodemailer
    await emailService.sendVerificationOtpEmail(newUser.email, newUser.name, otp, rawToken);

    return {
      success: true,
      message: "Account created! Check your email to verify your account. A 6-digit verification code has been sent to your email.",
      email: normalizedEmail,
      requiresVerification: true,
    };
  }

  /**
   * Verify email via 6-digit numeric OTP and activate session
   */
  async verifyEmailOtp(email: string, rawOtp: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = rawOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      return {
        success: false,
        message: "Please enter a valid 6-digit verification code.",
      };
    }

    const user = await dbService.users.findOne({ email: normalizedEmail });
    if (!user) {
      return {
        success: false,
        message: "User account not found. Please sign up first.",
      };
    }

    if (user.emailVerified) {
      const token = createSessionJwt(user._id, user.email);
      return {
        success: true,
        message: "Email is already verified. You are now logged in.",
        user: toSafeUser(user),
        token,
      };
    }

    if (!user.verificationOtpHash || !user.verificationOtpExpiresAt) {
      return {
        success: false,
        message: "No active verification code found. Please request a new code.",
      };
    }

    if (user.verificationOtpExpiresAt < new Date()) {
      return {
        success: false,
        message: "Verification code has expired. Please click 'Resend Code'.",
      };
    }

    const hashedInput = hashToken(cleanOtp);
    if (hashedInput !== user.verificationOtpHash) {
      return {
        success: false,
        message: "Invalid verification code. Please check your email and try again.",
      };
    }

    // Activate account and clear OTP
    const now = new Date();
    await dbService.users.updateOne(
      { _id: user._id },
      {
        emailVerified: true,
        emailVerifiedAt: now,
        verificationOtpHash: null,
        verificationOtpExpiresAt: null,
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
        lastLoginAt: now,
        updatedAt: now,
      }
    );

    const token = createSessionJwt(user._id, user.email);
    const safeUser = toSafeUser({
      ...user,
      emailVerified: true,
      emailVerifiedAt: now,
      lastLoginAt: now,
    });

    return {
      success: true,
      message: "Email verified successfully! Welcome to SkillTwin.",
      user: safeUser,
      token,
    };
  }

  /**
   * Resend 6-digit OTP code to user's email via Nodemailer
   */
  async resendVerificationOtp(email: string): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await dbService.users.findOne({ email: normalizedEmail });

    // Anti-enumeration: return success message even if not found or already verified
    if (!user || user.emailVerified) {
      return {
        success: true,
        message: "If an unverified account exists for this email, a verification code has been sent.",
        email: normalizedEmail,
      };
    }

    const otp = generateOtp();
    const otpHashed = hashToken(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await dbService.users.updateOne(
      { _id: user._id },
      {
        verificationOtpHash: otpHashed,
        verificationOtpExpiresAt: otpExpiresAt,
        updatedAt: new Date(),
      }
    );

    await emailService.sendVerificationOtpEmail(user.email, user.name, otp);

    return {
      success: true,
      message: "A new 6-digit verification code has been sent to your email.",
      email: normalizedEmail,
      requiresVerification: true,
    };
  }

  /**
   * Verify email via cryptographically secure single-use token (backward compatibility)
   */
  async verifyEmail(rawToken: string): Promise<{ success: boolean; message: string }> {
    if (!rawToken || !rawToken.trim()) {
      return { success: false, message: "Verification token is required." };
    }

    const hashedToken = hashToken(rawToken.trim());
    const user = await dbService.users.findOne({ verificationTokenHash: hashedToken });

    if (!user) {
      return {
        success: false,
        message: "Invalid or previously used verification token.",
      };
    }

    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      return {
        success: false,
        message: "Verification link has expired. Please request a new verification code.",
      };
    }

    // Activate account and invalidate token
    await dbService.users.updateOne(
      { _id: user._id },
      {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
        verificationOtpHash: null,
        verificationOtpExpiresAt: null,
      }
    );

    return {
      success: true,
      message: "Email verified successfully! You can now sign in to your SkillTwin account.",
    };
  }

  /**
   * Resend email verification token (backward compatibility)
   */
  async resendVerification(email: string): Promise<AuthResponse> {
    return this.resendVerificationOtp(email);
  }

  /**
   * Authenticate user with email and password
   */
  async login(data: LoginRequest): Promise<LoginResult> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await dbService.users.findOne({ email: normalizedEmail });

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    if (!user.passwordHash) {
      return {
        success: false,
        message: "This account was registered using a social provider (Google, GitHub, or LinkedIn). Please sign in with your social account or use 'Forgot Password' to set a password.",
      };
    }

    const isValidPassword = await verifyPassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    if (!user.emailVerified) {
      // Send a fresh 6-digit OTP so the user can immediately verify their email
      const otp = generateOtp();
      const otpHashed = hashToken(otp);
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await dbService.users.updateOne(
        { _id: user._id },
        {
          verificationOtpHash: otpHashed,
          verificationOtpExpiresAt: otpExpiresAt,
          updatedAt: new Date(),
        }
      );

      await emailService.sendVerificationOtpEmail(user.email, user.name, otp);

      return {
        success: false,
        message: "Please verify your email before signing in. We have sent a 6-digit verification code to your email.",
        requiresVerification: true,
        email: user.email,
      };
    }

    // Update last login
    await dbService.users.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    const token = createSessionJwt(user._id, user.email);
    const safeUser = toSafeUser({ ...user, lastLoginAt: new Date() });

    return {
      success: true,
      message: "Successfully signed in.",
      user: safeUser,
      token,
    };
  }

  /**
   * Request password reset token
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await dbService.users.findOne({ email: normalizedEmail });

    // Generic safe response to prevent email harvesting
    const genericResponse = {
      success: true,
      message: "If an account exists for this email, a password reset link has been sent.",
    };

    if (!user) {
      return genericResponse;
    }

    const { rawToken, hashedToken } = generateSecureToken();
    const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await dbService.users.updateOne(
      { _id: user._id },
      {
        resetPasswordTokenHash: hashedToken,
        resetPasswordTokenExpiresAt: tokenExpiresAt,
      }
    );

    await emailService.sendPasswordResetEmail(user.email, user.name, rawToken);

    return genericResponse;
  }

  /**
   * Reset password using single-use reset token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    const hashedToken = hashToken(data.token.trim());
    const user = await dbService.users.findOne({ resetPasswordTokenHash: hashedToken });

    if (!user) {
      return {
        success: false,
        message: "Invalid or expired password reset token.",
      };
    }

    if (user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt < new Date()) {
      return {
        success: false,
        message: "Password reset link has expired. Please request a new one.",
      };
    }

    const newPasswordHash = await hashPassword(data.password);

    await dbService.users.updateOne(
      { _id: user._id },
      {
        passwordHash: newPasswordHash,
        resetPasswordTokenHash: null,
        resetPasswordTokenExpiresAt: null,
        updatedAt: new Date(),
      }
    );

    return {
      success: true,
      message: "Password updated successfully. Your password has been successfully reset. You can now sign in with your new password.",
    };
  }

  /**
   * Update user profile fields
   */
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<SafeUser | null> {
    const user = await dbService.users.findOne({ _id: userId });
    if (!user) return null;

    const updates: Partial<UserDoc> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      updates.name = data.name.trim();
    }
    if (data.avatarUrl !== undefined) {
      updates.avatarUrl = data.avatarUrl;
    }

    if (data.headline !== undefined || data.targetRole !== undefined || data.bio !== undefined) {
      updates.profile = {
        ...user.profile,
        ...(data.headline !== undefined ? { headline: data.headline.trim() } : {}),
        ...(data.targetRole !== undefined ? { targetRole: data.targetRole.trim() } : {}),
        ...(data.bio !== undefined ? { bio: data.bio.trim() } : {}),
      };
    }

    await dbService.users.updateOne({ _id: userId }, updates);

    const updated = await dbService.users.findOne({ _id: userId });
    return updated ? toSafeUser(updated) : null;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<SafeUser | null> {
    const user = await dbService.users.findOne({ _id: userId });
    return user ? toSafeUser(user) : null;
  }

  /**
   * Disconnect an OAuth provider identity safely
   */
  async disconnectProvider(userId: string, provider: OAuthProviderType): Promise<{
    success: boolean;
    message: string;
    user?: SafeUser;
  }> {
    const user = await dbService.users.findOne({ _id: userId });
    if (!user) {
      return { success: false, message: "User not found." };
    }

    const currentProviders = user.providers || [];
    const targetIndex = currentProviders.findIndex((p) => p.provider === provider);

    if (targetIndex === -1) {
      return {
        success: false,
        message: `${provider.toUpperCase()} account is not currently connected to your profile.`,
      };
    }

    // Security check: Must have at least one other login method (either password or another provider)
    const hasPassword = Boolean(user.passwordHash && user.passwordHash.length > 0);
    const otherProvidersCount = currentProviders.length - 1;

    if (!hasPassword && otherProvidersCount <= 0) {
      return {
        success: false,
        message: "Cannot disconnect your only login method. Please set a password or link another account first.",
      };
    }

    const updatedProviders = currentProviders.filter((p) => p.provider !== provider);
    await dbService.users.updateOne(
      { _id: userId },
      {
        providers: updatedProviders,
        updatedAt: new Date(),
      }
    );

    const updatedUser = await dbService.users.findOne({ _id: userId });
    return {
      success: true,
      message: `Disconnected ${provider.toUpperCase()} account successfully.`,
      user: toSafeUser(updatedUser!),
    };
  }

  /**
   * Get connected providers status for a user
   */
  async getConnectedProviders(userId: string): Promise<{
    providers: Array<{
      provider: OAuthProviderType;
      providerId: string;
      email?: string;
      displayName?: string;
      avatarUrl?: string;
      connectedAt: string;
    }>;
    hasPassword: boolean;
  } | null> {
    const user = await dbService.users.findOne({ _id: userId });
    if (!user) return null;

    const hasPassword = Boolean(user.passwordHash && user.passwordHash.length > 0);
    const providers = (user.providers || []).map((p) => ({
      provider: p.provider,
      providerId: p.providerId,
      email: p.email,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      connectedAt: p.connectedAt instanceof Date ? p.connectedAt.toISOString() : String(p.connectedAt),
    }));

    return { providers, hasPassword };
  }
}

export const authService = new AuthService();
