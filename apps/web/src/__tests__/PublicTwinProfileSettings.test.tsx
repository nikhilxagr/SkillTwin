import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileView } from "../components/profile/ProfileView.js";
import type { SafeUser } from "@skilltwin/contracts";
import * as clientModule from "../api/client.js";

describe("Phase 4: Public Verified Twin Profile Settings in ProfileView", () => {
  const mockUser: SafeUser = {
    id: "usr-candidate-1",
    username: "alexdev",
    email: "alex@example.com",
    name: "Alex Developer",
    emailVerified: true,
    avatarUrl: "",
    profile: {
      headline: "Senior Cloud & Distributed Systems Engineer",
      targetRole: "Senior Backend Engineer",
      bio: "Building high throughput microservices.",
    },
    publicSettings: {
      username: "alexdev",
      isPublic: true,
      allowRecruiterJdMatch: true,
      showGithubEvidence: true,
      showSkillMatrix: true,
      showProjects: true,
      contactEmailVisible: false,
      customPitch: "Currently open to Senior Distributed Systems roles in NYC or Remote.",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hasPassword: true,
    connectedProviders: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Public Twin Settings card with initial handle, status, and feature toggles", () => {
    render(
      <ProfileView
        currentUser={mockUser}
        onUpdateUser={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    // Verify card exists
    expect(screen.getByTestId("public-twin-settings-card")).toBeDefined();
    expect(screen.getByText(/Public "Verified Twin" Recruiter Dossier/i)).toBeDefined();

    // Verify status badge
    expect(screen.getByTestId("twin-status-public")).toBeDefined();
    expect(screen.getByText(/Publicly Discoverable/i)).toBeDefined();

    // Verify username handle input
    const usernameInput = screen.getByTestId("twin-username-input") as HTMLInputElement;
    expect(usernameInput.value).toBe("alexdev");

    // Verify all 6 feature toggles are rendered
    expect(screen.getByTestId("toggle-public-visibility")).toBeDefined();
    expect(screen.getByTestId("toggle-recruiter-matcher")).toBeDefined();
    expect(screen.getByTestId("toggle-github-evidence")).toBeDefined();
    expect(screen.getByTestId("toggle-skill-matrix")).toBeDefined();
    expect(screen.getByTestId("toggle-projects")).toBeDefined();
    expect(screen.getByTestId("toggle-contact-email")).toBeDefined();

    // Verify custom pitch text
    const pitchInput = screen.getByTestId("twin-custom-pitch-input") as HTMLTextAreaElement;
    expect(pitchInput.value).toContain("Currently open to Senior Distributed Systems roles");

    // Verify Action buttons
    expect(screen.getByTestId("copy-twin-link-btn")).toBeDefined();
    expect(screen.getByTestId("preview-twin-btn")).toBeDefined();
    expect(screen.getByTestId("save-twin-settings-btn")).toBeDefined();
  });

  it("toggles privacy switches and updates custom elevator pitch", async () => {
    render(
      <ProfileView
        currentUser={mockUser}
        onUpdateUser={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const publicToggle = screen.getByTestId("toggle-public-visibility");
    expect(publicToggle.getAttribute("aria-checked")).toBe("true");

    // Toggle public visibility to private
    fireEvent.click(publicToggle);
    expect(publicToggle.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByTestId("twin-status-private")).toBeDefined();

    // Edit custom elevator pitch
    const pitchInput = screen.getByTestId("twin-custom-pitch-input");
    fireEvent.change(pitchInput, {
      target: { value: "Lead Systems Engineer targeting distributed infrastructure." },
    });
    expect((pitchInput as HTMLTextAreaElement).value).toBe(
      "Lead Systems Engineer targeting distributed infrastructure."
    );
  });

  it("triggers debounced check on username change and calls updateUserProfile on save", async () => {
    const checkUsernameSpy = vi
      .spyOn(clientModule, "checkUsernameAvailability")
      .mockResolvedValue({ available: true, message: "Handle is available!" });

    const updateUserProfileSpy = vi
      .spyOn(clientModule, "updateUserProfile")
      .mockResolvedValue({
        ...mockUser,
        username: "alex-systems",
        publicSettings: {
          ...mockUser.publicSettings!,
          username: "alex-systems",
          contactEmailVisible: true,
        },
      });

    const onUpdateUserMock = vi.fn();

    render(
      <ProfileView
        currentUser={mockUser}
        onUpdateUser={onUpdateUserMock}
        onNavigate={vi.fn()}
      />
    );

    const usernameInput = screen.getByTestId("twin-username-input");
    fireEvent.change(usernameInput, { target: { value: "alex-systems" } });

    await waitFor(() => {
      expect(checkUsernameSpy).toHaveBeenCalledWith("alex-systems");
    });

    // Toggle contact email to true
    const contactEmailToggle = screen.getByTestId("toggle-contact-email");
    fireEvent.click(contactEmailToggle);

    // Click Save Twin Settings
    const saveBtn = screen.getByTestId("save-twin-settings-btn");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateUserProfileSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "alex-systems",
          publicSettings: expect.objectContaining({
            contactEmailVisible: true,
          }),
        })
      );
    });

    expect(onUpdateUserMock).toHaveBeenCalled();
  });

  it("handles copy dossier link and preview dossier navigation", () => {
    const onNavigateMock = vi.fn();
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ProfileView
        currentUser={mockUser}
        onUpdateUser={vi.fn()}
        onNavigate={onNavigateMock}
      />
    );

    // Click Copy Link
    const copyBtn = screen.getByTestId("copy-twin-link-btn");
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining("#/@alexdev"));

    // Click Preview Dossier
    const previewBtn = screen.getByTestId("preview-twin-btn");
    fireEvent.click(previewBtn);
    expect(onNavigateMock).toHaveBeenCalledWith("public_twin");
  });
});
