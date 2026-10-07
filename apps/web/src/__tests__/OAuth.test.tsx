import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SocialAuthButtons } from "../components/auth/SocialAuthButtons.js";
import { LoginView } from "../components/auth/LoginView.js";
import { ProfileView } from "../components/profile/ProfileView.js";
import type { SafeUser } from "@skilltwin/contracts";

describe("PHASE 14: Social Authentication & Connected Accounts Frontend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Google, GitHub, and LinkedIn social buttons", () => {
    render(<SocialAuthButtons mode="login" />);

    expect(screen.getByTestId("oauth-google-btn")).toBeDefined();
    expect(screen.getByTestId("oauth-github-btn")).toBeDefined();
    expect(screen.getByTestId("oauth-linkedin-btn")).toBeDefined();
    expect(screen.getByText(/Continue with Google/i)).toBeDefined();
    expect(screen.getByText(/GitHub/i)).toBeDefined();
    expect(screen.getByText(/LinkedIn/i)).toBeDefined();
  });

  it("renders SocialAuthButtons inside LoginView with or continue with email divider", () => {
    render(<LoginView onNavigate={vi.fn()} onLoginSuccess={vi.fn()} />);

    expect(screen.getByTestId("oauth-google-btn")).toBeDefined();
    expect(screen.getByTestId("oauth-github-btn")).toBeDefined();
    expect(screen.getByTestId("oauth-linkedin-btn")).toBeDefined();
    expect(screen.getByText(/or continue with email/i)).toBeDefined();
  });

  it("renders Connected Accounts in ProfileView with provider status", () => {
    const userWithGoogle: SafeUser = {
      id: "usr-social-1",
      email: "alex@example.com",
      name: "Alex Developer",
      emailVerified: true,
      avatarUrl: "https://example.com/avatar.jpg",
      profile: {
        headline: "Cloud Engineer",
        targetRole: "Senior Cloud Engineer",
        bio: "Specializing in distributed systems.",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasPassword: false, // OAuth-only user
      connectedProviders: [
        {
          provider: "google",
          providerId: "google-sub-1234",
          email: "alex@example.com",
          displayName: "Alex Developer",
          connectedAt: new Date().toISOString(),
        },
      ],
    };

    render(
      <ProfileView
        currentUser={userWithGoogle}
        onUpdateUser={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    // Verify Connected Accounts card is rendered
    expect(screen.getByTestId("connected-accounts-card")).toBeDefined();
    expect(screen.getByText(/Connected Accounts & Social Login/i)).toBeDefined();

    // Verify Google is marked Connected
    expect(screen.getByTestId("provider-row-google")).toBeDefined();
    expect(screen.getByText(/1 of 3 Linked/i)).toBeDefined();

    // Because this user has NO password and only Google, Google should be marked as Primary Login Method
    expect(screen.getByText(/Primary Login Method/i)).toBeDefined();

    // Verify GitHub and LinkedIn have Connect buttons
    expect(screen.getByTestId("connect-provider-github-btn")).toBeDefined();
    expect(screen.getByTestId("connect-provider-linkedin-btn")).toBeDefined();
  });

  it("enables Disconnect button when user has a password or multiple providers", () => {
    const userWithMultiple: SafeUser = {
      id: "usr-social-2",
      email: "multi@example.com",
      name: "Multi Provider User",
      emailVerified: true,
      avatarUrl: "",
      profile: {
        headline: "Full Stack Engineer",
        targetRole: "Full Stack Engineer",
        bio: "",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasPassword: true, // Has password!
      connectedProviders: [
        {
          provider: "google",
          providerId: "google-1",
          email: "multi@example.com",
          connectedAt: new Date().toISOString(),
        },
        {
          provider: "github",
          providerId: "github-2",
          email: "multi@github.com",
          connectedAt: new Date().toISOString(),
        },
      ],
    };

    render(
      <ProfileView
        currentUser={userWithMultiple}
        onUpdateUser={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByTestId("disconnect-provider-google-btn")).toBeDefined();
    expect(screen.getByTestId("disconnect-provider-github-btn")).toBeDefined();
  });
});
