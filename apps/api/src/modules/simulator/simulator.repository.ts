import type {
  InterviewSessionState,
  InterviewHistoryItem,
} from "@skilltwin/contracts";

export class SimulatorRepository {
  private sessions: Map<string, InterviewSessionState> = new Map();
  private latestSessionId: string | null = null;

  constructor() {
    this.seedInitialHistory();
  }

  saveSession(session: InterviewSessionState): void {
    this.sessions.set(session.id, session);
    this.latestSessionId = session.id;
  }

  getSession(id: string): InterviewSessionState | undefined {
    return this.sessions.get(id);
  }

  getLatestSession(): InterviewSessionState | undefined {
    if (!this.latestSessionId) return undefined;
    return this.sessions.get(this.latestSessionId);
  }

  listSessions(): InterviewSessionState[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  listHistory(): InterviewHistoryItem[] {
    return this.listSessions().map((s) => ({
      id: s.id,
      jobTitle: s.jobTitle,
      company: s.company,
      status: s.status,
      overallScore: s.finalReport?.overallScore ?? null,
      completedQuestionsCount: s.exchanges.length,
      totalQuestionsCount: s.totalSteps,
      createdAt: s.createdAt,
      completedAt: s.finalReport?.completedAt ?? null,
    }));
  }

  clear(): void {
    this.sessions.clear();
    this.latestSessionId = null;
  }

  private seedInitialHistory(): void {
    const historicalSession: InterviewSessionState = {
      id: "sim-hist-seed-01",
      resumeId: "resume-seed-1",
      jobId: "job-seed-1",
      jobTitle: "Senior Full-Stack Engineer",
      company: "Stripe",
      status: "completed",
      currentStepIndex: 3,
      totalSteps: 3,
      currentQuestion: null,
      plannedQuestions: [
        {
          id: "q-role-seed",
          type: "role_specific",
          question: "As a Senior Full-Stack Engineer at Stripe, how would you design high-reliability webhook delivery services?",
          context: "Targeting Stripe's payment infrastructure resiliency requirements.",
          whyAsked: "Validates distributed systems design and idempotency knowledge.",
          expectedKeyPoints: ["Idempotency keys", "Exponential backoff", "Dead letter queues", "Transactional outbox"],
        },
        {
          id: "q-proj-seed",
          type: "project",
          question: "In your project DevPlatform SaaS, how did you handle state synchronization across distributed client nodes?",
          context: "Deep dive into real project architecture.",
          relatedProject: "DevPlatform SaaS",
          whyAsked: "Evaluates production state management ownership.",
          expectedKeyPoints: ["Optimistic concurrency", "WebSocket heartbeats", "Event ordering", "Conflict resolution"],
        },
        {
          id: "q-tech-seed",
          type: "technical",
          question: "How do you mitigate database connection pool exhaustion under sudden traffic spikes?",
          context: "Core PostgreSQL scaling requirement.",
          focusSkill: "PostgreSQL",
          whyAsked: "Probes backend throughput optimization under stress.",
          expectedKeyPoints: ["Connection pooling (PgBouncer)", "Read replicas", "Query timeout budgets", "Circuit breaking"],
        },
      ],
      exchanges: [
        {
          id: "ex-seed-1",
          step: 1,
          question: {
            id: "q-role-seed",
            type: "role_specific",
            question: "As a Senior Full-Stack Engineer at Stripe, how would you design high-reliability webhook delivery services?",
            context: "Targeting Stripe's payment infrastructure resiliency requirements.",
            whyAsked: "Validates distributed systems design and idempotency knowledge.",
            expectedKeyPoints: ["Idempotency keys", "Exponential backoff", "Dead letter queues", "Transactional outbox"],
          },
          answer: "We decouple webhook generation from delivery using a transactional outbox pattern in Postgres. Events are published to a queue, processed by workers with unique idempotency keys, and retried using exponential backoff with jitter. Dead-letter queues catch permanent 4xx/5xx failures for manual replay.",
          evaluation: {
            technicalAccuracy: 92,
            depth: 88,
            communication: 90,
            projectUnderstanding: 86,
            conciseFeedback: "Exceptional architecture answer with crisp coverage of idempotency, retries, and dead-letter queues.",
            strengthsObserved: [
              "Addressed tangible technical trade-offs and operational realities.",
              "Directly tackled key expected engineering concepts.",
              "Structured response clearly with coherent progression.",
            ],
            areasToImprove: [
              "Consider explicitly mentioning edge-case resilience and observability patterns.",
            ],
            followUpQuestion: "How do you prevent webhook worker starvation when one tenant has millions of pending events?",
          },
          timestamp: "2026-10-04T14:30:00.000Z",
        },
        {
          id: "ex-seed-2",
          step: 2,
          question: {
            id: "q-proj-seed",
            type: "project",
            question: "In your project DevPlatform SaaS, how did you handle state synchronization across distributed client nodes?",
            context: "Deep dive into real project architecture.",
            relatedProject: "DevPlatform SaaS",
            whyAsked: "Evaluates production state management ownership.",
            expectedKeyPoints: ["Optimistic concurrency", "WebSocket heartbeats", "Event ordering", "Conflict resolution"],
          },
          answer: "We used WebSocket channels backed by Redis Pub/Sub for broadcast. On the client, we utilized optimistic updates with vector clocks to detect concurrent edits, rolling back if the server rejected the version bump.",
          evaluation: {
            technicalAccuracy: 88,
            depth: 84,
            communication: 86,
            projectUnderstanding: 90,
            conciseFeedback: "Strong answer highlighting vector clocks and optimistic rollback mechanics.",
            strengthsObserved: [
              "Directly tackled key expected engineering concepts.",
              "Addressed tangible technical trade-offs and operational realities.",
            ],
            areasToImprove: [
              "Incorporate real-world trade-offs, failure modes, or performance metrics.",
            ],
            followUpQuestion: "What happened when client network partitions lasted longer than the Redis socket TTL?",
          },
          timestamp: "2026-10-04T14:38:00.000Z",
        },
        {
          id: "ex-seed-3",
          step: 3,
          question: {
            id: "q-tech-seed",
            type: "technical",
            question: "How do you mitigate database connection pool exhaustion under sudden traffic spikes?",
            context: "Core PostgreSQL scaling requirement.",
            focusSkill: "PostgreSQL",
            whyAsked: "Probes backend throughput optimization under stress.",
            expectedKeyPoints: ["Connection pooling (PgBouncer)", "Read replicas", "Query timeout budgets", "Circuit breaking"],
          },
          answer: "We deploy PgBouncer in transaction pooling mode between application pods and PostgreSQL. We enforce strict query timeout budgets (2000ms max) and route read-heavy traffic to read replicas, accompanied by circuit breakers at the API gateway layer.",
          evaluation: {
            technicalAccuracy: 90,
            depth: 89,
            communication: 88,
            projectUnderstanding: 85,
            conciseFeedback: "Well-reasoned database protection strategy with PgBouncer and circuit breaking.",
            strengthsObserved: [
              "Addressed tangible technical trade-offs and operational realities.",
              "Structured response clearly with coherent progression.",
            ],
            areasToImprove: [
              "Consider explicitly mentioning edge-case resilience and observability patterns.",
            ],
            followUpQuestion: "How do you handle session-level state when PgBouncer operates in transaction pooling mode?",
          },
          timestamp: "2026-10-04T14:45:00.000Z",
        },
      ],
      finalReport: {
        sessionId: "sim-hist-seed-01",
        jobTitle: "Senior Full-Stack Engineer",
        company: "Stripe",
        overallScore: 89,
        overallRating: "Strong Hire",
        summary: "Candidate completed 3 interview questions for Senior Full-Stack Engineer at Stripe. Overall performance is rated as 'Strong Hire' (89/100) with strongest evidence in communication and core technical clarity.",
        technicalAccuracy: {
          score: 91,
          rating: "Excellent",
          summary: "Consistently demonstrated exceptional Technical Accuracy with thorough reasoning and strong engineering rigor.",
        },
        depth: {
          score: 87,
          rating: "Excellent",
          summary: "Consistently demonstrated exceptional Technical Depth with thorough reasoning and strong engineering rigor.",
        },
        communication: {
          score: 88,
          rating: "Excellent",
          summary: "Consistently demonstrated exceptional Communication with thorough reasoning and strong engineering rigor.",
        },
        projectUnderstanding: {
          score: 87,
          rating: "Excellent",
          summary: "Consistently demonstrated exceptional Project Understanding with thorough reasoning and strong engineering rigor.",
        },
        strengths: [
          "Addressed tangible technical trade-offs and operational realities.",
          "Directly tackled key expected engineering concepts.",
          "Structured response clearly with coherent progression.",
        ],
        areasToImprove: [
          "Consider explicitly mentioning edge-case resilience and observability patterns.",
          "Incorporate real-world trade-offs, failure modes, or performance metrics.",
        ],
        actionableRecommendations: [
          "Review system design principles for Senior Full-Stack Engineer, focusing on asynchronous resilience and caching layers.",
          "Practice articulating your project contributions using STAR with concrete performance metrics.",
          "When asked about unfamiliar technologies, transparently explain how you ramp up from adjacent tools.",
        ],
        exchanges: [],
        completedAt: "2026-10-04T14:46:00.000Z",
      },
      createdAt: "2026-10-04T14:28:00.000Z",
      updatedAt: "2026-10-04T14:46:00.000Z",
    };

    this.sessions.set(historicalSession.id, historicalSession);
  }
}

export const simulatorRepository = new SimulatorRepository();
