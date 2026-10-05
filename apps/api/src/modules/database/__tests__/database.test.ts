import { describe, expect, it, beforeEach } from "vitest";
import { DatabaseService } from "../database.service.js";

describe("Database Service & Collection Semantics", () => {
  let db: DatabaseService;

  beforeEach(async () => {
    db = new DatabaseService();
  });

  it("inserts and finds a user by email", async () => {
    const user = {
      _id: "usr-1",
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hash123",
      emailVerified: false,
      emailVerifiedAt: null,
      verificationTokenHash: "token123",
      verificationTokenExpiresAt: new Date(Date.now() + 86400000),
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
      avatarUrl: "",
      profile: {
        headline: "Developer",
        targetRole: "Full Stack",
        bio: "Testing bio",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    await db.users.insertOne(user);
    const found = await db.users.findOne({ email: "test@example.com" });
    expect(found).not.toBeNull();
    expect(found?.name).toBe("Test User");
  });

  it("enforces unique email constraint in collection", async () => {
    const user1 = {
      _id: "usr-1",
      name: "User One",
      email: "duplicate@example.com",
      passwordHash: "hash1",
      emailVerified: false,
      emailVerifiedAt: null,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
      avatarUrl: "",
      profile: { headline: "", targetRole: "", bio: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    const user2 = {
      _id: "usr-2",
      name: "User Two",
      email: "duplicate@example.com",
      passwordHash: "hash2",
      emailVerified: false,
      emailVerifiedAt: null,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
      avatarUrl: "",
      profile: { headline: "", targetRole: "", bio: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    await db.users.insertOne(user1);
    await expect(db.users.insertOne(user2)).rejects.toThrow(/duplicate key/i);
  });

  it("updates and deletes records properly", async () => {
    const user = {
      _id: "usr-3",
      name: "User Three",
      email: "three@example.com",
      passwordHash: "hash3",
      emailVerified: false,
      emailVerifiedAt: null,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
      avatarUrl: "",
      profile: { headline: "", targetRole: "", bio: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    await db.users.insertOne(user);
    const updated = await db.users.updateOne({ _id: "usr-3" }, { emailVerified: true });
    expect(updated).toBe(true);

    const found = await db.users.findOne({ _id: "usr-3" });
    expect(found?.emailVerified).toBe(true);

    const deleted = await db.users.deleteOne({ _id: "usr-3" });
    expect(deleted).toBe(true);
    expect(await db.users.findOne({ _id: "usr-3" })).toBeNull();
  });
});
