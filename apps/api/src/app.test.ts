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

describe("GET /api/v1/gap-analysis", () => {
  it("compares evidence with the selected role", async () => {
    const response = await request(app).get("/api/v1/gap-analysis?roleId=full-stack-developer");
    expect(response.status).toBe(200);
    expect(response.body.role.name).toBe("Full Stack Developer");
    expect(response.body.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ skill: "Docker", status: "missing_evidence" }),
    ]));
  });

  describe("GET /api/v1/roadmap", () => {
    it("prioritizes practical evidence-producing tasks", async () => {
      const response = await request(app).get("/api/v1/roadmap?roleId=full-stack-developer");
      expect(response.status).toBe(200);
      expect(response.body.items).toEqual(expect.arrayContaining([
        expect.objectContaining({ skill: "Node.js", priority: "high" }),
      ]));
      expect(response.body.items).toEqual(expect.arrayContaining([
        expect.objectContaining({ skill: "Docker", expectedEvidence: expect.arrayContaining(["Dockerfile"]) }),
      ]));
    });
  });
});
