import { describe, expect, it, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { dbService } from "../../database/database.service.js";
import { oauthService } from "../oauth.service.js";
import { hashPassword } from "../auth.security.js";

describe("PHASE 14: Google, GitHub & LinkedIn OAuth Authentication", () => {
  beforeEach(async () => {
    await dbService.clearAll();
  });

  it("1. Initiates OAuth authorization with tamper-proof signed state token", async () => {
    const res = await request(app).get("/api/auth/google");
    expect(res.status).toBe(302);
    const location = res.headers.location;
    expect(location).toContain("accounts.google.com");
    expect(location).toContain("state=");

    const stateParam = new URL(location).searchParams.get("state")!;
    expect(stateParam).toBeDefined();
    const verified = oauthService.verifyState(stateParam);
    expect(verified.provider).toBe("google");
    expect(verified.action).toBe("login");
  });

  it("2. Creates a new user via Google OAuth callback and sets session cookie", async () => {
    const state = oauthService.createState("google", "login");

    const res = await request(app)
      .get(`/api/auth/google/callback?code=mock_code_123&state=${state}&format=json`)
      .set("Accept", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.action).toBe("created");
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("mock-google-123@example.com");
    expect(res.body.user.emailVerified).toBe(true);
    expect(res.body.user.hasPassword).toBe(false);
    expect(res.body.user.connectedProviders).toHaveLength(1);
    expect(res.body.user.connectedProviders[0].provider).toBe("google");

    // Check Set-Cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("skilltwin_session=");
  });

  it("3. Maps multiple providers (Google + GitHub + LinkedIn) to ONE SkillTwin internal userId", async () => {
    // Step A: Register via Google OAuth
    const googleState = oauthService.createState("google", "login");
    const googleRes = await request(app)
      .get(`/api/auth/google/callback?code=mock_code_single_user&state=${googleState}&format=json`)
      .set("Accept", "application/json");

    expect(googleRes.status).toBe(200);
    const initialUser = googleRes.body.user;
    const initialUserId = initialUser.id;
    const sessionToken = googleRes.body.token;

    // Step B: Authenticated user links GitHub
    const githubLinkState = oauthService.createState("github", "link", initialUserId);
    const githubRes = await request(app)
      .get(`/api/auth/github/callback?code=mock_code_github_456&state=${githubLinkState}&format=json`)
      .set("Accept", "application/json");

    expect(githubRes.status).toBe(200);
    expect(githubRes.body.action).toBe("linked");
    expect(githubRes.body.user.id).toBe(initialUserId); // Same internal userId!
    expect(githubRes.body.user.connectedProviders).toHaveLength(2);

    // Step C: Authenticated user links LinkedIn
    const linkedinLinkState = oauthService.createState("linkedin", "link", initialUserId);
    const linkedinRes = await request(app)
      .get(`/api/auth/linkedin/callback?code=mock_code_linkedin_789&state=${linkedinLinkState}&format=json`)
      .set("Accept", "application/json");

    expect(linkedinRes.status).toBe(200);
    expect(linkedinRes.body.action).toBe("linked");
    expect(linkedinRes.body.user.id).toBe(initialUserId); // Same internal userId!
    expect(linkedinRes.body.user.connectedProviders).toHaveLength(3);

    // Verify GET /api/auth/providers returns all 3 connected providers
    const providersRes = await request(app)
      .get("/api/auth/providers")
      .set("Authorization", `Bearer ${sessionToken}`);

    expect(providersRes.status).toBe(200);
    expect(providersRes.body.success).toBe(true);
    expect(providersRes.body.providers).toHaveLength(3);
    const providerNames = providersRes.body.providers.map((p: any) => p.provider);
    expect(providerNames).toContain("google");
    expect(providerNames).toContain("github");
    expect(providerNames).toContain("linkedin");
    expect(providersRes.body.hasPassword).toBe(false);
  });

  it("4. Prevents account linking collision if an OAuth identity is already connected to another user", async () => {
    // User A connects GitHub id 999
    const stateA = oauthService.createState("github", "login");
    const userARes = await request(app)
      .get(`/api/auth/github/callback?code=mock_code_999&state=${stateA}&format=json`)
      .set("Accept", "application/json");
    expect(userARes.status).toBe(200);

    // User B registers with Google
    const stateB = oauthService.createState("google", "login");
    const userBRes = await request(app)
      .get(`/api/auth/google/callback?code=mock_code_user_b&state=${stateB}&format=json`)
      .set("Accept", "application/json");
    expect(userBRes.status).toBe(200);
    const userBId = userBRes.body.user.id;

    // User B tries to link GitHub id 999
    const collisionState = oauthService.createState("github", "link", userBId);
    const collisionRes = await request(app)
      .get(`/api/auth/github/callback?code=mock_code_999&state=${collisionState}&format=json`)
      .set("Accept", "application/json");

    expect(collisionRes.status).toBe(400);
    expect(collisionRes.body.success).toBe(false);
    expect(collisionRes.body.message).toContain("already connected to another SkillTwin account");
  });

  it("5. Disconnect provider enforcement: cannot disconnect the only sign-in method without password", async () => {
    // Create user with Google only
    const state = oauthService.createState("google", "login");
    const signupRes = await request(app)
      .get(`/api/auth/google/callback?code=mock_code_solo&state=${state}&format=json`)
      .set("Accept", "application/json");
    const token = signupRes.body.token;

    // Try to disconnect Google when it is the ONLY login method -> REJECTED
    const disconnectSolo = await request(app)
      .delete("/api/auth/providers/google")
      .set("Authorization", `Bearer ${token}`);

    expect(disconnectSolo.status).toBe(400);
    expect(disconnectSolo.body.success).toBe(false);
    expect(disconnectSolo.body.message).toContain("Cannot disconnect your only login method");

    // Add GitHub as a second provider
    const linkState = oauthService.createState("github", "link", signupRes.body.user.id);
    await request(app)
      .get(`/api/auth/github/callback?code=mock_code_second&state=${linkState}&format=json`)
      .set("Accept", "application/json");

    // Now disconnect Google -> SUCCEEDS because GitHub remains
    const disconnectWithBackup = await request(app)
      .delete("/api/auth/providers/google")
      .set("Authorization", `Bearer ${token}`);

    expect(disconnectWithBackup.status).toBe(200);
    expect(disconnectWithBackup.body.success).toBe(true);
    expect(disconnectWithBackup.body.user.connectedProviders).toHaveLength(1);
    expect(disconnectWithBackup.body.user.connectedProviders[0].provider).toBe("github");
  });

  it("6. Prevents automatic merging if OAuth provider email is unverified", async () => {
    // Existing user with email
    await dbService.users.insertOne({
      _id: "usr-existing-victim",
      name: "Victim User",
      email: "victim@target.com",
      passwordHash: await hashPassword("ValidPassword123!"),
      emailVerified: true,
      emailVerifiedAt: new Date(),
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
      avatarUrl: "",
      profile: { headline: "", targetRole: "Dev", bio: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    });

    // An unverified OAuth profile arrives with victim's email
    const fakeStateToken = oauthService.createState("github", "login");
    const fakeStatePayload = oauthService.verifyState(fakeStateToken);
    const result = await oauthService.handleOAuthCallback(
      {
        provider: "github",
        providerId: "malicious-123",
        email: "victim@target.com",
        emailVerified: false, // NOT VERIFIED BY GITHUB
        name: "Attacker",
      },
      fakeStatePayload
    );

    // MUST NOT MERGE!
    expect(result.success).toBe(false);
    expect(result.message).toContain("email is not verified");

    // Verify existing user was not touched
    const victim = await dbService.users.findOne({ email: "victim@target.com" });
    expect(victim?.providers || []).toHaveLength(0);
  });
});
