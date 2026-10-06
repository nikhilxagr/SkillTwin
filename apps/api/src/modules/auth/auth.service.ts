import crypto from "node:crypto";
import { config } from "../../config.js";
import { dbService } from "../database/database.service.js";
import type { UserDoc } from "../database/database.types.js";
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
}

export class AuthService {
  /**
   * Register a new user with unverified email and send verification link
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

    // Send verification email
    await emailService.sendVerificationEmail(newUser.email, newUser.name, rawToken);

    return {
      success: true,
      message: "Account created. Check your email to verify your account.",
      verificationToken: rawToken,
      verificationUrl: `${config.WEB_ORIGIN}/#/verify-email?token=${rawToken}`,
    };
  }

  /**
   * Verify email via cryptographically secure single-use token
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
        message: "Verification link has expired. Please request a new verification email.",
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
      }
    );

    return {
      success: true,
      message: "Email verified successfully! You can now sign in to your SkillTwin account.",
    };
  }

  /**
   * Resend email verification token
   */
  async resendVerification(email: string): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await dbService.users.findOne({ email: normalizedEmail });

    // Protect against account enumeration: return success even if email not found
    if (!user || user.emailVerified) {
      return {
        success: true,
        message: "If an unverified account exists for this email, a verification link has been sent.",
      };
    }

    const { rawToken, hashedToken } = generateSecureToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await dbService.users.updateOne(
      { _id: user._id },
      {
        verificationTokenHash: hashedToken,
        verificationTokenExpiresAt: tokenExpiresAt,
      }
    );

    await emailService.sendVerificationEmail(user.email, user.name, rawToken);

    return {
      success: true,
      message: "If an unverified account exists for this email, a verification link has been sent.",
      verificationToken: rawToken,
      verificationUrl: `${config.WEB_ORIGIN}/#/verify-email?token=${rawToken}`,
    };
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

    const isValidPassword = await verifyPassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    if (!user.emailVerified) {
      return {
        success: false,
        message: "Please verify your email before signing in.",
        requiresVerification: true,
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
        message: "Invalid or previously used password reset token.",
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
      }
    );

    return {
      success: true,
      message: "Your password has been successfully reset. Please sign in with your new password.",
    };
  }

  /**
   * Get user profile by userId
   */
  async getProfile(userId: string): Promise<SafeUser | null> {
    const user = await dbService.users.findOne({ _id: userId });
    if (!user) return null;
    return toSafeUser(user);
  }

  /**
   * Update profile information
   */
  async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<SafeUser | null> {
    const user = await dbService.users.findOne({ _id: userId });
    if (!user) return null;

    const updatedProfile = {
      ...user.profile,
      ...(updates.headline !== undefined && { headline: updates.headline }),
      ...(updates.targetRole !== undefined && { targetRole: updates.targetRole }),
      ...(updates.bio !== undefined && { bio: updates.bio }),
    };

    const updateDoc: Partial<UserDoc> = {
      profile: updatedProfile,
      ...(updates.name && { name: updates.name.trim() }),
      ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
    };

    await dbService.users.updateOne({ _id: userId }, updateDoc);

    const refreshed = await dbService.users.findOne({ _id: userId });
    return refreshed ? toSafeUser(refreshed) : null;
  }
}

export const authService = new AuthService();
