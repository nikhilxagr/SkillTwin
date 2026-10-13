import { describe, expect, it, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { dbService } from "../../database/database.service.js";
import type { UserDoc } from "../../database/database.types.js";

describe("Feature 1: Public 'Verified Twin' Recruiter Dossier & JD Matcher API", () => {
  beforeEach(async () => {
    await dbService.clearAll();
  });

  const createTestUser = async (
    overrides: Partial<Omit<UserDoc, "publicSettings">> & {
      publicSettings?: Partial<NonNullable<UserDoc["publicSettings"]>>;
    } = {}
  ): Promise<UserDoc> => {
    const baseSettings = {
      username: "nikhil",
      isPublic: true,
      allowRecruiterJdMatch: true,
      showGithubEvidence: true,
      showSkillMatrix: true,
      showProjects: true,
      contactEmailVisible: false,
      customPitch: "Actively looking for high-impact Staff / Senior engineering roles.",
      linkedinUrl: "https://linkedin.com/in/nikhilagrahari",
      githubUrl: "https://github.com/nikhilxagr",
      portfolioUrl: "https://nikhil.dev",
    };

    const user: UserDoc = {
      _id: "usr-test-123",
      name: "Nikhil Agrahari",
      username: "nikhil",
      email: "nikhil@skilltwin.dev",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      verificationOtpHash: null,
      verificationOtpExpiresAt: null,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
      avatarUrl: "https://example.com/avatar.png",
      profile: {
        headline: "Senior Full Stack & AI Systems Engineer",
        targetRole: "Senior Full Stack Engineer",
        bio: "Specializing in distributed systems, TypeScript, and modern web architectures.",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      ...overrides,
      publicSettings: {
        ...baseSettings,
        ...(overrides.publicSettings || {}),
      },
    };
    return dbService.users.insertOne(user);
  };

  it("retrieves a public twin dossier for an existing user without authentication", async () => {
    await createTestUser();

    const res = await request(app).get("/api/v1/public/twin/nikhil");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile).toBeDefined();

    const profile = res.body.profile;
    expect(profile.username).toBe("nikhil");
    expect(profile.name).toBe("Nikhil Agrahari");
    expect(profile.headline).toBe("Senior Full Stack & AI Systems Engineer");
    expect(profile.targetRole).toBe("Senior Full Stack Engineer");
    expect(profile.verifiedBadges.emailVerified).toBe(true);
    expect(profile.verifiedBadges.totalRepositoriesAnalyzed).toBeGreaterThan(0);
    expect(profile.skills.length).toBeGreaterThan(0);
    expect(profile.featuredProjects.length).toBeGreaterThan(0);
    expect(profile.socials.github).toBe("https://github.com/nikhilxagr");
    expect(profile.socials.linkedin).toBe("https://linkedin.com/in/nikhilagrahari");

    // Email must NOT be leaked when contactEmailVisible is false
    expect(profile.socials.contactEmail).toBeUndefined();
  });

  it("supports leading '@' in the username path parameter (@nikhil)", async () => {
    await createTestUser();

    const res = await request(app).get("/api/v1/public/twin/@nikhil");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile.username).toBe("nikhil");
  });

  it("returns 404 if profile does not exist", async () => {
    const res = await request(app).get("/api/v1/public/twin/nonexistent_user");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("not found or is set to private");
  });

  it("returns 404 if candidate has set their profile to private", async () => {
    await createTestUser({
      publicSettings: {
        username: "nikhil",
        isPublic: false,
        allowRecruiterJdMatch: false,
        showGithubEvidence: false,
        showSkillMatrix: false,
        showProjects: false,
        contactEmailVisible: false,
      },
    });

    const res = await request(app).get("/api/v1/public/twin/nikhil");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("not found or is set to private");
  });

  it("respects privacy toggles: contactEmailVisible, showSkillMatrix, showProjects", async () => {
    await createTestUser({
      publicSettings: {
        username: "nikhil",
        isPublic: true,
        allowRecruiterJdMatch: true,
        showGithubEvidence: true,
        showSkillMatrix: false, // Hidden
        showProjects: false, // Hidden
        contactEmailVisible: true, // Visible
      },
    });

    const res = await request(app).get("/api/v1/public/twin/nikhil");

    expect(res.status).toBe(200);
    expect(res.body.profile.socials.contactEmail).toBe("nikhil@skilltwin.dev");
    expect(res.body.profile.skills).toEqual([]);
    expect(res.body.profile.featuredProjects).toEqual([]);
  });

  it("executes recruiter JD matching and returns fit score with verified evidence proof", async () => {
    await createTestUser();

    const recruiterJd = `
      Senior Full Stack Engineer
      We are looking for a Senior Developer with strong proficiency in TypeScript, React, and Node.js.
      Requirements:
      - 4+ years experience with TypeScript and Node.js backends
      - Proficiency in React and modern state management
      - Experience with PostgreSQL and Docker container deployments
      - Familiarity with CI/CD pipelines and Git
    `;

    const res = await request(app)
      .post("/api/v1/public/twin/nikhil/match")
      .send({
        jobDescriptionText: recruiterJd,
        roleTitle: "Senior Full Stack Engineer",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const result = res.body.data;
    expect(result.matchPercentage).toBeGreaterThanOrEqual(70);
    expect(["High", "Strong", "Moderate"]).toContain(result.matchLevel);
    expect(result.matchingSkills.length).toBeGreaterThan(0);

    // Verify evidence citation is included for matched skills
    const tsMatch = result.matchingSkills.find((s: any) =>
      s.skill.toLowerCase().includes("typescript")
    );
    expect(tsMatch).toBeDefined();
    expect(tsMatch.verifiedEvidence).toBeDefined();
    expect(typeof tsMatch.verifiedEvidence).toBe("string");

    expect(result.strengths.length).toBeGreaterThanOrEqual(2);
    expect(result.summary).toContain("Nikhil Agrahari");
  });

  it("validates recruiter JD matching request payload", async () => {
    await createTestUser();

    // Payload too short (< 10 chars)
    const res = await request(app)
      .post("/api/v1/public/twin/nikhil/match")
      .send({
        jobDescriptionText: "short",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("10+ characters");
  });

  it("returns 404 when recruiter matching is disabled by the candidate", async () => {
    await createTestUser({
      publicSettings: {
        username: "nikhil",
        isPublic: true,
        allowRecruiterJdMatch: false, // Disabled by user
        showGithubEvidence: true,
        showSkillMatrix: true,
        showProjects: true,
        contactEmailVisible: false,
      },
    });

    const res = await request(app)
      .post("/api/v1/public/twin/nikhil/match")
      .send({
        jobDescriptionText: "Looking for a React and Node.js developer.",
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("recruiter matching is disabled");
  });
});
