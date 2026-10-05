import { describe, expect, it, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { dbService } from "../../database/database.service.js";
import { emailService } from "../email.service.js";

describe("Phase 13: Secure Authentication, Email Verification & Multi-User Ownership", () => {
  beforeEach(async () => {
    await dbService.clearAll();
    emailService.clear();
  });

  it("completes full signup -> email verification -> login -> authenticated session flow", async () => {
    // 1. Sign up new user
    const signupRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Nikhil Agrahari",
        email: "nikhil@skilltwin.dev",
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
      });

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);
    expect(signupRes.body.message).toContain("Check your email to verify your account");

    // Check email service intercepted the verification email in development mode
    const sentEmail = emailService.getLatestEmailFor("nikhil@skilltwin.dev");
    expect(sentEmail).toBeDefined();
    expect(sentEmail?.type).toBe("verification");
    const rawToken = sentEmail!.token;
    expect(rawToken).toBeDefined();

    // Verify user in DB has emailVerified = false and NEVER stores plain password
    const userInDb = await dbService.users.findOne({ email: "nikhil@skilltwin.dev" });
    expect(userInDb).not.toBeNull();
    expect(userInDb?.emailVerified).toBe(false);
    expect(userInDb?.passwordHash).not.toBe("SecurePassword123!");
    expect(userInDb?.passwordHash.startsWith("$2")).toBe(true);

    // 2. Attempt login before verification -> MUST BE REJECTED with 403
    const unverifiedLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "nikhil@skilltwin.dev",
        password: "SecurePassword123!",
      });

    expect(unverifiedLogin.status).toBe(403);
    expect(unverifiedLogin.body.requiresVerification).toBe(true);
    expect(unverifiedLogin.body.message).toContain("Please verify your email");

    // 3. Verify email with the cryptographically secure token
    const verifyRes = await request(app)
      .get(`/api/v1/auth/verify-email?token=${rawToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.message).toContain("Email verified successfully");

    // Verify token is single-use: attempting reuse must fail
    const reuseVerify = await request(app)
      .get(`/api/v1/auth/verify-email?token=${rawToken}`);
    expect(reuseVerify.status).toBe(400);

    // 4. Log in as verified user
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "nikhil@skilltwin.dev",
        password: "SecurePassword123!",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.user).toBeDefined();
    expect(loginRes.body.user.name).toBe("Nikhil Agrahari");
    expect(loginRes.body.user.email).toBe("nikhil@skilltwin.dev");
    expect(loginRes.body.user.emailVerified).toBe(true);
    expect(loginRes.body.user.passwordHash).toBeUndefined(); // NEVER leak password hash

    // Check HTTP-only cookie set
    const cookies = loginRes.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies.find((c: string) => c.startsWith("skilltwin_session="));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain("HttpOnly");

    // 5. Query /api/v1/auth/me using the cookie session
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", sessionCookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("nikhil@skilltwin.dev");

    // 6. Logout and verify cookie is cleared
    const logoutRes = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", sessionCookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.headers["set-cookie"][0]).toContain("skilltwin_session=;");
  });

  it("rejects duplicate email signups with a safe message", async () => {
    await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Alex",
        email: "alex@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });

    const duplicateRes = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Alex Twin",
        email: "alex@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.success).toBe(false);
  });

  it("handles forgot password and reset password flow securely", async () => {
    // Register and verify a user
    await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Sarah Dev",
        email: "sarah@example.com",
        password: "OldPassword123!",
        confirmPassword: "OldPassword123!",
      });

    const signupEmail = emailService.getLatestEmailFor("sarah@example.com");
    await request(app).get(`/api/v1/auth/verify-email?token=${signupEmail!.token}`);

    // Request forgot password
    const forgotRes = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "sarah@example.com" });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.message).toContain("If an account exists for this email");

    const resetEmail = emailService.getLatestEmailFor("sarah@example.com");
    expect(resetEmail?.type).toBe("password_reset");
    const resetToken = resetEmail!.token;

    // Reset password
    const resetRes = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        token: resetToken,
        password: "BrandNewPassword456!",
        confirmPassword: "BrandNewPassword456!",
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toContain("successfully reset");

    // Old password fails
    const oldLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "sarah@example.com", password: "OldPassword123!" });
    expect(oldLogin.status).toBe(401);

    // New password succeeds
    const newLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "sarah@example.com", password: "BrandNewPassword456!" });
    expect(newLogin.status).toBe(200);
  });

  it("SECURITY TEST: User A and User B data isolation (User B cannot access or IDOR User A's resume)", async () => {
    // 1. Create and verify User A
    await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "User Alpha",
        email: "alpha@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
    const emailA = emailService.getLatestEmailFor("alpha@example.com");
    await request(app).get(`/api/v1/auth/verify-email?token=${emailA!.token}`);

    const loginA = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "alpha@example.com", password: "Password123!" });
    const cookieA = loginA.headers["set-cookie"].find((c: string) => c.startsWith("skilltwin_session="));

    // 2. Create and verify User B
    await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "User Beta",
        email: "beta@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
    const emailB = emailService.getLatestEmailFor("beta@example.com");
    await request(app).get(`/api/v1/auth/verify-email?token=${emailB!.token}`);

    const loginB = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "beta@example.com", password: "Password123!" });
    const cookieB = loginB.headers["set-cookie"].find((c: string) => c.startsWith("skilltwin_session="));

    // 3. User A uploads Resume A
    const uploadA = await request(app)
      .post("/api/v1/resumes/text")
      .set("Cookie", cookieA)
      .send({
        fileName: "Alpha_Resume.txt",
        text: "John Alpha | Senior Software Engineer | React, Node.js, TypeScript, PostgreSQL",
      });

    expect(uploadA.status).toBe(201);
    const resumeAId = uploadA.body.data.resume.id;
    expect(resumeAId).toBeDefined();

    // 4. User A can fetch Resume A
    const getResA = await request(app)
      .get(`/api/v1/resumes/${resumeAId}`)
      .set("Cookie", cookieA);
    expect(getResA.status).toBe(200);
    expect(getResA.body.data.id).toBe(resumeAId);

    // 5. User B attempts IDOR to access User A's resume by ID -> MUST RETURN 404
    const idorRes = await request(app)
      .get(`/api/v1/resumes/${resumeAId}`)
      .set("Cookie", cookieB);
    expect(idorRes.status).toBe(404);
    expect(idorRes.body.status).toBe("error");

    // 6. User B attempts to delete User A's resume -> MUST RETURN 404 / FORBIDDEN
    const deleteIdor = await request(app)
      .delete(`/api/v1/resumes/${resumeAId}`)
      .set("Cookie", cookieB);
    expect(deleteIdor.status).toBe(404);

    // 7. Check User B's resumes list -> MUST BE EMPTY
    const listB = await request(app)
      .get("/api/v1/resumes")
      .set("Cookie", cookieB);
    expect(listB.status).toBe(200);
    expect(listB.body.data.length).toBe(0);

    // 8. Check User A's resumes list -> CONTAINS RESUME A
    const listA = await request(app)
      .get("/api/v1/resumes")
      .set("Cookie", cookieA);
    expect(listA.status).toBe(200);
    expect(listA.body.data.length).toBe(1);
    expect(listA.body.data[0].id).toBe(resumeAId);
  });

  it("updates and retrieves user profile information", async () => {
    // Signup and login
    await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Dev Twin",
        email: "dev@skilltwin.dev",
        password: "Password123!",
        confirmPassword: "Password123!",
      });

    const email = emailService.getLatestEmailFor("dev@skilltwin.dev");
    await request(app).get(`/api/v1/auth/verify-email?token=${email!.token}`);

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "dev@skilltwin.dev", password: "Password123!" });
    const cookie = loginRes.headers["set-cookie"].find((c: string) => c.startsWith("skilltwin_session="));

    // Get initial profile
    const profileRes = await request(app)
      .get("/api/v1/profile")
      .set("Cookie", cookie);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.user.name).toBe("Dev Twin");

    // Update profile
    const updateRes = await request(app)
      .patch("/api/v1/profile")
      .set("Cookie", cookie)
      .send({
        targetRole: "Staff Software Engineer",
        headline: "Distributed Systems & Cloud Architect",
        bio: "Specializing in high-throughput Node.js microservices",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user.profile.targetRole).toBe("Staff Software Engineer");
    expect(updateRes.body.user.profile.headline).toBe("Distributed Systems & Cloud Architect");
  });
});
