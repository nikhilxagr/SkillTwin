import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app.js";

describe("GET /health", () => {
  it("returns the API health contract", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("skilltwin-api");
  });

  describe("GET /api/v1/demo/twin", () => {
    it("returns explainable seeded twin data", async () => {
      const response = await request(app).get("/api/v1/demo/twin");
      expect(response.status).toBe(200);
      expect(response.body.skills[0]).toMatchObject({
        skill: "React",
        confidenceEstimate: 78,
        evidenceSources: ["github", "project"],
      });
    });
  });
});
