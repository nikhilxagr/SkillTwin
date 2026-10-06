import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { App } from "../App.js";
import { SignupView } from "../components/auth/SignupView.js";
import { LoginView } from "../components/auth/LoginView.js";
import { VerifyEmailView } from "../components/auth/VerifyEmailView.js";
import { ForgotPasswordView } from "../components/auth/ForgotPasswordView.js";
import { ResetPasswordView } from "../components/auth/ResetPasswordView.js";
import { ProfileView } from "../components/profile/ProfileView.js";
import { DashboardView } from "../components/dashboard/DashboardView.js";
import { ResumeUploadView } from "../components/resume/ResumeUploadView.js";
import { JobUploadView } from "../components/job/JobUploadView.js";
import { SkillMatrixView } from "../components/matrix/SkillMatrixView.js";
import { GapAnalysisView } from "../components/gap/GapAnalysisView.js";
import { ResumeOptimizerView } from "../components/optimizer/ResumeOptimizerView.js";
import { LatexStudioView } from "../components/latex/LatexStudioView.js";
import { EvidencePageView } from "../components/evidence/EvidencePageView.js";
import { ProjectRecommendationsView } from "../components/projects/ProjectRecommendationsView.js";
import type { SafeUser } from "@skilltwin/contracts";

describe("SkillTwin Clean Production Shell & UI Views", () => {
  beforeEach(() => {
    window.scrollTo = () => {};
    window.location.hash = "";
  });

  it("renders the Landing Page with core value proposition and authentication CTA", () => {
    render(<App />);

    expect(screen.getByText(/Developer Career Intelligence/i)).toBeDefined();
    expect(screen.getByText(/Understand your skills/i)).toBeDefined();
    expect(screen.getByText(/Quantify your actual skills with evidence/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeDefined();
    expect(screen.getAllByRole("button", { name: /Get Started/i }).length).toBeGreaterThan(0);
  });

  it("navigates to Login page when Sign In button is clicked on Landing Page", async () => {
    render(<App />);

    const signInBtn = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(signInBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Welcome back/i })).toBeDefined();
      expect(screen.getByPlaceholderText(/name@example\.com/i)).toBeDefined();
    });
  });

  it("navigates to Signup page when user chooses to create account from login", async () => {
    render(<App />);

    const getStartedBtns = screen.getAllByRole("button", { name: /Get Started/i });
    fireEvent.click(getStartedBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Welcome back/i })).toBeDefined();
    });

    const switchToSignupBtn = screen.getByTestId("switch-to-signup-btn");
    fireEvent.click(switchToSignupBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Create your developer profile/i })).toBeDefined();
    });
  });

  it("renders LoginView with email and password fields and submit validation", async () => {
    const onNavigate = vi.fn();
    const onLoginSuccess = vi.fn();

    render(<LoginView onNavigate={onNavigate} onLoginSuccess={onLoginSuccess} />);

    expect(screen.getByLabelText(/Email address/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeDefined();

    // Fill valid format and submit
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "developer@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "StrongPassword123!" },
    });

    const form = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(form);
  });

  it("renders SignupView and validates registration inputs", () => {
    const onNavigate = vi.fn();
    const onSignupSuccess = vi.fn();

    render(<SignupView onNavigate={onNavigate} onSignupSuccess={onSignupSuccess} />);

    expect(screen.getByLabelText(/Full name/i)).toBeDefined();
    expect(screen.getByLabelText(/Email address/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password/i)).toBeDefined();
    expect(screen.getByLabelText(/Confirm password/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Create account/i })).toBeDefined();

    // Type strong password
    const passwordInput = screen.getByLabelText(/^Password/i);
    fireEvent.change(passwordInput, { target: { value: "SuperSecretPass123!" } });
    expect((passwordInput as HTMLInputElement).value).toBe("SuperSecretPass123!");
  });

  it("renders VerifyEmailView in pending verification mode", () => {
    const onNavigate = vi.fn();

    render(<VerifyEmailView onNavigate={onNavigate} />);

    expect(screen.getByText(/Check your email/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter your registered email/i)).toBeDefined();
    expect(screen.getByTestId("resend-verification-btn")).toBeDefined();
  });

  it("renders ForgotPasswordView and handles submission", () => {
    const onNavigate = vi.fn();

    render(<ForgotPasswordView onNavigate={onNavigate} />);

    expect(screen.getByText(/Reset your password/i)).toBeDefined();
    expect(screen.getByLabelText(/Email address/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Send password reset link/i })).toBeDefined();
  });

  it("renders ResetPasswordView with password inputs", () => {
    const onNavigate = vi.fn();

    render(<ResetPasswordView onNavigate={onNavigate} />);

    expect(screen.getByText(/Set new password/i)).toBeDefined();
    expect(screen.getByLabelText(/^New Password/i)).toBeDefined();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Reset password/i })).toBeDefined();
  });

  it("renders ProfileView with user account information and target role editing", () => {
    const mockUser: SafeUser = {
      id: "u-123",
      email: "nikhil@skilltwin.dev",
      name: "Nikhil Agrahari",
      emailVerified: true,
      profile: {
        targetRole: "Full Stack Engineer",
        targetCompany: "CloudScale Inc",
        githubUsername: "nikhilxagr",
        experienceYears: 4,
        bio: "Senior engineer focusing on scalable systems.",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <ProfileView
        currentUser={mockUser}
        onUpdateUser={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByText(/Nikhil Agrahari/i)).toBeDefined();
    expect(screen.getByText(/nikhil@skilltwin.dev/i)).toBeDefined();
    expect(screen.getByText(/Full Stack Engineer/i)).toBeDefined();
    expect(screen.getByTestId("verified-badge")).toBeDefined();
  });

  it("renders clean EmptyState on Dashboard when no matrix has been ingested", () => {
    const onNavigate = vi.fn();

    render(
      <DashboardView
        currentUser={null}
        resume={null}
        matrix={null}
        job={null}
        gapReport={null}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText(/Your developer profile is ready to build/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Upload Resume/i })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Upload Resume/i }));
    expect(onNavigate).toHaveBeenCalledWith("resume_upload");
  });

  it("renders ResumeUploadView with zero sample data prompts", () => {
    const onNavigate = vi.fn();
    const onUploadFile = vi.fn();
    const onUploadText = vi.fn();

    render(
      <ResumeUploadView
        currentResume={null}
        onUploadFile={onUploadFile}
        onUploadText={onUploadText}
        onNavigate={onNavigate}
        loading={false}
      />
    );

    expect(screen.getByText(/Resume Evidence Ingestion/i)).toBeDefined();
    expect(screen.getByText(/File Upload \(PDF \/ Text\)/i)).toBeDefined();
    expect(screen.getByText(/Direct Text Paste/i)).toBeDefined();
    expect(screen.queryByText(/Load Verified Sample Resume/i)).toBeNull();
  });

  it("renders JobUploadView with empty title/company and zero sample presets", () => {
    const onNavigate = vi.fn();
    const onUploadFile = vi.fn();
    const onUploadJob = vi.fn();

    render(
      <JobUploadView
        currentJob={null}
        onUploadFile={onUploadFile}
        onUploadJob={onUploadJob}
        onNavigate={onNavigate}
        loading={false}
      />
    );

    expect(screen.getByText(/Target Job Description Ingestion/i)).toBeDefined();
    expect(screen.queryByText(/Load Verified Senior JD/i)).toBeNull();
    expect(screen.queryByText(/Quick Presets/i)).toBeNull();
  });

  it("renders SkillMatrixView with clean empty state when no matrix is loaded", () => {
    const onNavigate = vi.fn();

    render(
      <SkillMatrixView
        matrix={null}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText(/Skill Matrix Not Generated/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Upload Resume/i })).toBeDefined();
    expect(screen.queryByText(/Load Sample Profile/i)).toBeNull();
  });

  it("renders GapAnalysisView with clean empty state when no report is available", () => {
    const onNavigate = vi.fn();

    render(
      <GapAnalysisView
        report={null}
        onNavigate={onNavigate}
        onRecomputeGap={vi.fn()}
        onRunOptimization={vi.fn()}
      />
    );

    expect(screen.getByText(/Gap Analysis Not Available/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Compute Gap Analysis Now/i })).toBeDefined();
    expect(screen.queryByText(/Load Sample Profile/i)).toBeNull();
  });

  it("renders ResumeOptimizerView with clean empty state when no report is available", () => {
    const onNavigate = vi.fn();

    render(
      <ResumeOptimizerView
        optimization={null}
        resume={null}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText(/Optimization Report Not Generated/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Compare with Job/i })).toBeDefined();
    expect(screen.queryByText(/Load Sample Profile/i)).toBeNull();
  });

  it("renders ProjectRecommendationsView with clean empty state", () => {
    const onNavigate = vi.fn();

    render(
      <ProjectRecommendationsView
        report={null}
        blueprint={null}
        job={null}
        matrix={null}
        gapReport={null}
        onGenerateBlueprint={vi.fn()}
        onRefreshRecommendations={vi.fn()}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText(/No Project Recommendations Available/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Upload Job Description/i })).toBeDefined();
    expect(screen.queryByText(/Load Sample Profile/i)).toBeNull();
  });

  it("renders EvidencePageView with GitHub connect card and zero demo buttons", () => {
    const onNavigate = vi.fn();
    const onConnect = vi.fn();

    render(
      <EvidencePageView
        report={null}
        repositories={[]}
        resume={null}
        matrix={null}
        username=""
        token=""
        onConnect={onConnect}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText(/Evidence Verification & GitHub Integration/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter GitHub username\.\.\./i)).toBeDefined();
    expect(screen.queryByRole("button", { name: /Demo Profile/i })).toBeNull();
  });

  it("renders LatexStudioView without sample code pre-loaded", () => {
    const onNavigate = vi.fn();

    render(
      <LatexStudioView
        resume={null}
        tailoredResume={null}
        initialTexSource=""
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText(/LaTeX Resume Studio/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Sync From Profile/i })).toBeDefined();
  });
});
