import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import { simulatorRepository } from "../simulator.repository.js";

describe("Phase 9: Interview Simulator API", () => {
  beforeEach(() => {
    simulatorRepository.clear();
  });

  it("retrieves interview history with GET /api/v1/simulator/history", async () => {
    const res = await request(app).get("/api/v1/simulator/history");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("starts a new interview simulation session with POST /api/v1/simulator/start", async () => {
    const res = await request(app)
      .post("/api/v1/simulator/start")
      .send({ customQuestionsCount: 3 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    const session = res.body.data;
    expect(session.id).toBeDefined();
    expect(session.status).toBe("in_progress");
    expect(session.currentStepIndex).toBe(0);
    expect(session.totalSteps).toBe(3);
    expect(session.currentQuestion).toBeDefined();
    expect(session.currentQuestion.question).toBeDefined();
    expect(session.currentQuestion.whyAsked).toBeDefined();
    expect(session.exchanges).toHaveLength(0);
    expect(session.finalReport).toBeNull();
  });

  it("submits an answer and receives adaptive feedback with POST /api/v1/simulator/answer", async () => {
    const startRes = await request(app)
      .post("/api/v1/simulator/start")
      .send({ customQuestionsCount: 2 });

    const session = startRes.body.data;
    const q1 = session.currentQuestion;

    const answerRes = await request(app)
      .post("/api/v1/simulator/answer")
      .send({
        sessionId: session.id,
        questionId: q1.id,
        answer: "I structure services around clear domain boundaries, using asynchronous message queues for decoupling. I ensure graceful failure modes by using exponential backoff retries and circuit breaker patterns to prevent cascading failures.",
      });

    expect(answerRes.status).toBe(200);
    expect(answerRes.body.status).toBe("success");
    const { session: updatedSession, exchange } = answerRes.body.data;

    expect(exchange).toBeDefined();
    expect(exchange.step).toBe(1);
    expect(exchange.question.id).toBe(q1.id);
    expect(exchange.evaluation.technicalAccuracy).toBeGreaterThan(50);
    expect(exchange.evaluation.depth).toBeGreaterThan(50);
    expect(exchange.evaluation.communication).toBeGreaterThan(50);
    expect(exchange.evaluation.conciseFeedback).toBeDefined();
    expect(exchange.evaluation.strengthsObserved.length).toBeGreaterThan(0);
    expect(exchange.evaluation.areasToImprove.length).toBeGreaterThan(0);

    // Advances to step 2
    expect(updatedSession.currentStepIndex).toBe(1);
    expect(updatedSession.currentQuestion).toBeDefined();
    expect(updatedSession.status).toBe("in_progress");
  });

  it("completes the entire interview and generates the final readiness report", async () => {
    const startRes = await request(app)
      .post("/api/v1/simulator/start")
      .send({ customQuestionsCount: 2 });

    let session = startRes.body.data;

    // Step 1 answer
    const ans1Res = await request(app)
      .post("/api/v1/simulator/answer")
      .send({
        sessionId: session.id,
        questionId: session.currentQuestion.id,
        answer: "To architect scalable workflows for Acme Cloud Technologies, I decompose services along clean domain boundaries using TypeScript and React on the frontend. We containerize each service using Docker, handle concurrency using transactional outbox queues, and enforce automated integration testing to ensure production resilience.",
      });
    session = ans1Res.body.data.session;
    expect(session.status).toBe("in_progress");

    // Step 2 answer
    const ans2Res = await request(app)
      .post("/api/v1/simulator/answer")
      .send({
        sessionId: session.id,
        questionId: session.currentQuestion.id,
        answer: "In DevPlatform SaaS, we faced p99 latency spikes of 450ms during peak deployments. We analyzed PostgreSQL query plans, introduced composite B-tree indexes, and integrated Redis cache-aside, reducing p99 latency by 35% under load testing.",
      });
    session = ans2Res.body.data.session;

    // Interview should now be completed
    expect(session.status).toBe("completed");
    expect(session.currentQuestion).toBeNull();
    expect(session.finalReport).toBeDefined();

    const report = session.finalReport;
    expect(report.overallScore).toBeGreaterThanOrEqual(60);
    expect(["Strong Hire", "Hire", "Leaning Hire"]).toContain(report.overallRating);
    expect(report.technicalAccuracy.score).toBeGreaterThan(0);
    expect(report.technicalAccuracy.rating).toBeDefined();
    expect(report.depth.score).toBeGreaterThan(0);
    expect(report.communication.score).toBeGreaterThan(0);
    expect(report.projectUnderstanding.score).toBeGreaterThan(0);
    expect(report.areasToImprove.length).toBeGreaterThan(0);
    expect(report.actionableRecommendations.length).toBeGreaterThan(0);

    // Session can be fetched via GET /api/v1/simulator/session/:id
    const fetchRes = await request(app).get(`/api/v1/simulator/session/${session.id}`);
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.data.id).toBe(session.id);
  });

  it("returns 400 when submitting an empty answer", async () => {
    const startRes = await request(app)
      .post("/api/v1/simulator/start")
      .send({ customQuestionsCount: 2 });

    const session = startRes.body.data;

    const res = await request(app)
      .post("/api/v1/simulator/answer")
      .send({
        sessionId: session.id,
        questionId: session.currentQuestion.id,
        answer: "",
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_INPUT");
  });

  it("returns 404 for an unknown session ID", async () => {
    const res = await request(app)
      .post("/api/v1/simulator/answer")
      .send({
        sessionId: "non-existent-session-id",
        questionId: "any-q",
        answer: "Valid answer content.",
      });

    expect(res.status).toBe(404);
  });
});
