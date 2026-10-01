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

    describe("Interview simulator", () => {
      it("creates profile-specific questions", async () => {
        const response = await request(app).get("/api/v1/interviews/demo");
        expect(response.status).toBe(200);
        expect(response.body.questions[0]).toMatchObject({ focusSkill: "React" });
        expect(response.body.questions[0].projectContext).toBeTruthy();
      });

      describe("GET /api/v1/evolution", () => {
        it("returns historical evidence changes with limitations", async () => {
          const response = await request(app).get("/api/v1/evolution");
          expect(response.status).toBe(200);
          expect(response.body.snapshots).toHaveLength(3);
          expect(response.body.disclaimer).toContain("not proof");
        });

        describe("POST /api/v1/resume", () => {
          it("rejects uploads that are not PDF files", async () => {
            const response = await request(app)
              .post("/api/v1/resume")
              .attach("resume", Buffer.from("not a pdf"), { filename: "resume.txt", contentType: "text/plain" });
            expect(response.status).toBe(400);
            expect(response.body.error).toContain("PDF");
          });

          describe("GitHub evidence adapter", () => {
            it("exposes safe demo connection status", async () => {
              const response = await request(app).get("/api/v1/github/status");
              expect(response.status).toBe(200);
              expect(response.body.mode).toBe("demo");
              expect(response.body.connected).toBe(false);
            });

            it("returns repository signals without exposing credentials", async () => {
              const response = await request(app).post("/api/v1/github/sync");
              expect(response.status).toBe(200);
              expect(response.body.repositoriesAnalyzed).toBe(3);
              expect(response.body.evidence[0].signals).toBeDefined();
              expect(JSON.stringify(response.body)).not.toContain("token");
            });
          });
        });
      });

      it("evaluates an answer without claiming verified proficiency", async () => {
        const response = await request(app)
          .post("/api/v1/interviews/demo/evaluate")
          .send({ answer: "I chose this approach because the tradeoff improved performance. I would validate it with tests and security checks in the API boundary." });
        expect(response.status).toBe(200);
        expect(response.body.evidenceNote).toContain("not stored as verified skill evidence");
      });
    });
  });
});
