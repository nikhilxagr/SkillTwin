import { z } from "zod";

export const userProfileSchema = z.object({
  headline: z.string().max(160).optional().default(""),
  targetRole: z.string().max(100).optional().default("Full Stack Developer"),
  bio: z.string().max(1000).optional().default(""),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const safeUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  emailVerifiedAt: z.string().nullable().optional(),
  avatarUrl: z.string().optional().default(""),
  profile: userProfileSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  lastLoginAt: z.string().nullable().optional(),
});

export type SafeUser = z.infer<typeof safeUserSchema>;

export const signupRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const loginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const verifyEmailRequestSchema = z.object({
  token: z.string().trim().min(1, "Verification token is required"),
});

export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

export const resendVerificationRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
});

export type ResendVerificationRequest = z.infer<typeof resendVerificationRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const updateProfileRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .optional(),
  headline: z.string().max(160).optional(),
  targetRole: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const authResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: safeUserSchema.optional(),
  requiresVerification: z.boolean().optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
