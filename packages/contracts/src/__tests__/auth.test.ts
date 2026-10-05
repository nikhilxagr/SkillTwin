import { describe, expect, it } from "vitest";
import {
  signupRequestSchema,
  loginRequestSchema,
  safeUserSchema,
  resetPasswordRequestSchema,
} from "../auth.js";

describe("Auth Contracts & Schemas", () => {
  it("validates successful signup input", () => {
    const valid = {
      name: "Nikhil Agrahari",
      email: "Nikhil@Example.COM",
      password: "StrongPassword123",
      confirmPassword: "StrongPassword123",
    };

    const parsed = signupRequestSchema.parse(valid);
    expect(parsed.name).toBe("Nikhil Agrahari");
    expect(parsed.email).toBe("nikhil@example.com"); // normalized lowercase
  });

  it("rejects mismatched passwords during signup", () => {
    const invalid = {
      name: "Nikhil Agrahari",
      email: "nikhil@example.com",
      password: "StrongPassword123",
      confirmPassword: "DifferentPassword123",
    };

    expect(() => signupRequestSchema.parse(invalid)).toThrow("Passwords do not match");
  });

  it("rejects passwords under 8 characters or without numbers", () => {
    const tooShort = {
      name: "Nikhil",
      email: "nikhil@example.com",
      password: "short",
      confirmPassword: "short",
    };
    expect(() => signupRequestSchema.parse(tooShort)).toThrow("Password must be at least 8 characters");

    const noNumbers = {
      name: "Nikhil",
      email: "nikhil@example.com",
      password: "allletterslongpassword",
      confirmPassword: "allletterslongpassword",
    };
    expect(() => signupRequestSchema.parse(noNumbers)).toThrow("Password must contain at least one number");
  });

  it("validates login request and normalizes email", () => {
    const parsed = loginRequestSchema.parse({
      email: " User@SkillTwin.AI ",
      password: "SecretPassword1",
    });
    expect(parsed.email).toBe("user@skilltwin.ai");
  });

  it("validates safe user schema structure", () => {
    const safeUser = {
      id: "usr-12345",
      name: "Alex Rivera",
      email: "alex@example.com",
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      avatarUrl: "https://example.com/avatar.png",
      profile: {
        headline: "Full Stack Engineer",
        targetRole: "Senior React Developer",
        bio: "Passionate about high-performance apps",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const parsed = safeUserSchema.parse(safeUser);
    expect(parsed.id).toBe("usr-12345");
    expect(parsed.profile.targetRole).toBe("Senior React Developer");
  });
});
