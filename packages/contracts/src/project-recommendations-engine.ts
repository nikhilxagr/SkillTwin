import type { JobExtraction } from "./job.js";
import type { SkillMatrix } from "./skills.js";
import type { GapAnalysisReport, ComparisonItem } from "./gap.js";
import {
  recommendedProjectSchema,
  projectRecommendationReportSchema,
  projectBlueprintSchema,
  type RecommendedProject,
  type ProjectRecommendationReport,
  type ProjectBlueprint,
  type ProjectDifficulty,
} from "./project-recommendations.js";

export interface ProjectRecommendationInput {
  job?: JobExtraction | null;
  matrix?: SkillMatrix | null;
  gapReport?: GapAnalysisReport | null;
}

/**
 * Normalizes skill strings for case-insensitive keyword detection.
 */
function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Extracts all gap skills from the GapAnalysisReport and/or Job + Matrix comparison.
 */
export function extractTargetGaps(
  gapReport?: GapAnalysisReport | null,
  job?: JobExtraction | null,
  matrix?: SkillMatrix | null
): { targetGaps: string[]; existingSkills: string[] } {
  const gapSet = new Set<string>();
  const strongSet = new Set<string>();

  // Extract strong skills from matrix items
  if (matrix?.items) {
    for (const item of matrix.items) {
      if (item.proficiency === "Strong" || item.proficiency === "Intermediate" || item.confidence >= 70) {
        strongSet.add(item.canonicalName);
      }
    }
  }

  // Extract from gap report if provided
  if (gapReport) {
    const criticalAndPartial: ComparisonItem[] = [
      ...(gapReport.criticalGaps || []),
      ...(gapReport.partialGaps || []),
      ...(gapReport.weakEvidence || []),
    ];

    for (const item of criticalAndPartial) {
      gapSet.add(item.canonicalName);
    }
  }

  // If no gap report items found, compare job requirements with matrix
  if (gapSet.size === 0 && job) {
    const allReqs = [...(job.requiredSkills || []), ...(job.preferredSkills || [])];
    const candidateSkillNames = new Set(
      (matrix?.items || []).map((s: { canonicalName: string }) => normalize(s.canonicalName))
    );

    for (const req of allReqs) {
      const norm = normalize(req.canonicalName);
      if (!candidateSkillNames.has(norm)) {
        gapSet.add(req.canonicalName);
      }
    }
  }

  // Fallback default gaps if candidate has not provided any JD
  if (gapSet.size === 0) {
    ["Docker", "Testing", "Redis", "AWS"].forEach((g) => gapSet.add(g));
  }

  if (strongSet.size === 0) {
    ["React", "Node.js", "TypeScript"].forEach((s) => strongSet.add(s));
  }

  return {
    targetGaps: Array.from(gapSet),
    existingSkills: Array.from(strongSet),
  };
}

/**
 * Phase 10: Deterministic Project Recommendation Engine.
 *
 * Grounded in the candidate's exact gaps and verified skills.
 * Produces production-grade engineering systems, not generic tutorials.
 */
export function generateProjectRecommendations(
  input: ProjectRecommendationInput
): ProjectRecommendationReport {
  const { job, matrix, gapReport } = input;
  const { targetGaps, existingSkills } = extractTargetGaps(gapReport, job, matrix);

  const targetRole = job?.title || gapReport?.targetRole || "Senior Full-Stack Engineer";
  const targetCompany = job?.company || gapReport?.company || "Target Tech Organization";

  const lowerGaps = targetGaps.map(normalize);
  const hasDocker = lowerGaps.some((g) => g.includes("docker") || g.includes("container"));
  const hasTesting = lowerGaps.some((g) => g.includes("test") || g.includes("jest") || g.includes("vitest") || g.includes("cypress"));
  const hasRedis = lowerGaps.some((g) => g.includes("redis") || g.includes("cache") || g.includes("caching"));
  const hasAWS = lowerGaps.some((g) => g.includes("aws") || g.includes("cloud") || g.includes("s3") || g.includes("ecs"));
  const hasK8s = lowerGaps.some((g) => g.includes("kubernetes") || g.includes("k8s"));
  const hasGraphQL = lowerGaps.some((g) => g.includes("graphql"));
  const hasKafka = lowerGaps.some((g) => g.includes("kafka") || g.includes("rabbitmq") || g.includes("queue") || g.includes("event"));

  const projects: RecommendedProject[] = [];

  // Project 1: Production-Ready Task & Distributed Workflow Platform (Primary Flagship)
  const proj1Gaps = targetGaps.filter((g) => {
    const l = normalize(g);
    return (
      l.includes("docker") ||
      l.includes("redis") ||
      l.includes("test") ||
      l.includes("aws") ||
      l.includes("node") ||
      l.includes("typescript") ||
      l.includes("postgres") ||
      l.includes("sql")
    );
  });
  if (proj1Gaps.length === 0) {
    proj1Gaps.push("Docker", "Testing", "Redis", "AWS");
  }

  const proj1Skills = Array.from(
    new Set([
      ...existingSkills.filter((s) => ["React", "Node.js", "TypeScript", "JavaScript"].includes(s)),
      ...proj1Gaps,
      "React",
      "Node.js",
      "Docker",
      "Redis",
      "Testing",
      "AWS",
    ])
  );

  projects.push({
    id: "proj-workflow-platform",
    title: "Production-Ready Task & Distributed Workflow Platform",
    whyRelevant: `Specifically targets your priority gaps in ${proj1Gaps.join(
      ", "
    )}. Rather than a simple CRUD application, this project demonstrates multi-tenant asynchronous queue processing, cache-aside resilience, comprehensive test coverage (>80%), and containerized AWS deployment.`,
    targetedGaps: proj1Gaps,
    skillsDemonstrated: proj1Skills,
    difficulty: "Production-Grade",
    estimatedDuration: "2-3 weeks (part-time)",
    suggestedStack: [
      {
        category: "Frontend",
        technologies: ["React 18", "TypeScript", "Tailwind CSS", "TanStack Query"],
      },
      {
        category: "Backend & Queues",
        technologies: ["Node.js", "Express / Fastify", "TypeScript", "BullMQ"],
      },
      {
        category: "Database & Caching",
        technologies: ["PostgreSQL", "Prisma / Drizzle", "Redis 7 (Cache-aside & Queues)"],
      },
      {
        category: "DevOps & Cloud",
        technologies: ["Docker", "Docker Compose", "AWS ECS / ECR", "AWS S3"],
      },
      {
        category: "Testing & Quality",
        technologies: ["Vitest / Jest", "Supertest", "Playwright (E2E)"],
      },
    ],
    features: [
      "Distributed Asynchronous Job Processing with BullMQ, Redis concurrency limits, exponential backoff, and dead-letter queues (DLQ)",
      "High-Frequency Cache-Aside Layer in Redis with distributed mutex locks to eliminate cache stampedes on active tenant dashboards",
      "Robust Multi-Tenant Data Isolation with row-level security policies in PostgreSQL and idempotent task creation endpoints",
      "Automated Test Suite with unit tests for domain business logic, Supertest integration tests for all API endpoints, and mock Redis/DB fixtures",
      "Production Multi-Stage Docker Containerization with non-root security context, health check directives, and automated GitHub Actions CI pipeline",
    ],
    architecture: {
      pattern: "Asynchronous Micro-Monolith with Redis Broker & Cache-Aside Layer",
      overview:
        "Separates client-facing HTTP/WebSocket API ingress from CPU-intensive asynchronous task executors using Redis message brokers. PostgreSQL guarantees ACID transaction integrity for task definitions, while Redis delivers sub-millisecond status lookups and job deduplication.",
      components: [
        {
          name: "API Ingress & Auth Gateway",
          role: "Validates incoming payloads, enforces JWT authentication and tenant isolation, writes to PostgreSQL, and pushes jobs to Redis.",
          technologies: ["Node.js", "TypeScript", "Express", "Zod"],
        },
        {
          name: "Redis Broker & Cache-Aside Engine",
          role: "Manages BullMQ job queues, provides distributed locks (Redlock pattern), and caches hot dashboard summaries with 60s TTL.",
          technologies: ["Redis 7", "BullMQ", "ioredis"],
        },
        {
          name: "Asynchronous Worker Nodes",
          role: "Pulls task payloads from Redis, executes simulated compute/integration jobs, handles retries, and records execution metrics.",
          technologies: ["Node.js", "TypeScript", "BullMQ Worker"],
        },
        {
          name: "Relational Persistence & Storage",
          role: "Maintains ACID compliance, tenant data boundaries, and audit logs. S3 handles artifact output storage.",
          technologies: ["PostgreSQL 16", "AWS S3 / MinIO"],
        },
      ],
      dataFlow: [
        "1. Client dispatches authenticated task creation payload to POST /api/v1/tasks.",
        "2. API Gateway validates request schema, creates task record with status 'PENDING' in PostgreSQL, and enqueues job into Redis BullMQ.",
        "3. Redis Worker picks up job with concurrency control, transitions status to 'PROCESSING', and processes task payload.",
        "4. On completion, worker writes output to AWS S3, updates PostgreSQL status to 'COMPLETED', and invalidates Redis cache keys.",
        "5. Dashboard queries to GET /api/v1/tasks/summary hit Redis cache directly, falling back to PostgreSQL only on cache miss.",
      ],
      storageAndCaching:
        "PostgreSQL 16 serves as primary relational persistence with foreign-key indexes. Redis 7 serves dual roles: cache-aside layer with structured keys (`tenant:{id}:tasks`) and backing store for BullMQ asynchronous task queues.",
      containerizationAndDeployment:
        "Multi-stage Dockerfile builds a standalone production image (<140MB) using Node 20 Alpine with non-root runner user. Docker Compose spins up the API, worker, PostgreSQL, and Redis locally. Deploys to AWS ECS Fargate behind an Application Load Balancer with environment secrets stored in AWS SSM.",
    },
    milestones: [
      {
        milestoneNumber: 1,
        title: "Domain Entities, PostgreSQL Schemas & REST APIs",
        duration: "3-4 days",
        objectives: [
          "Define database schemas for tenants, users, and tasks with Prisma/Drizzle",
          "Build authenticated REST API routes with request validation using Zod",
          "Implement pagination and filtering for task history",
        ],
        deliverables: [
          "Working PostgreSQL migrations and seed script",
          "REST API routes with unit tests",
        ],
        evidenceTarget: "Passing API route tests and clean schema migration files",
      },
      {
        milestoneNumber: 2,
        title: "Redis Caching, BullMQ Background Queues & Pub/Sub",
        duration: "4-5 days",
        objectives: [
          "Set up Redis 7 and implement cache-aside pattern with TTL invalidation",
          "Build BullMQ worker process with concurrency limits and exponential backoff retry",
          "Implement Dead Letter Queue (DLQ) for failed task inspection",
        ],
        deliverables: [
          "Dedicated worker script running independently from API ingress",
          "Cache service with benchmarked response times",
        ],
        evidenceTarget: "Redis cache hit/miss benchmark metrics and queue processing logs",
      },
      {
        milestoneNumber: 3,
        title: "Automated Test Suite (Unit, Integration & E2E)",
        duration: "3-4 days",
        objectives: [
          "Write unit tests for core domain validators and worker processing logic",
          "Write Supertest integration tests against mock/test databases and Redis",
          "Add Playwright end-to-end tests for task submission and status polling",
        ],
        deliverables: [
          "Vitest test suite achieving >80% branch coverage",
          "Playwright E2E test suite running in headless mode",
        ],
        evidenceTarget: "Code coverage report (lcov/html) proving >80% test coverage",
      },
      {
        milestoneNumber: 4,
        title: "Docker Containerization, CI Pipeline & AWS Deployment",
        duration: "3-4 days",
        objectives: [
          "Create optimized multi-stage Dockerfile with non-root security context",
          "Write docker-compose.yml orchestrating API, worker, PostgreSQL, and Redis",
          "Create GitHub Actions workflow running lint, test, build, and image scan",
          "Deploy container to AWS ECS Fargate or AWS App Runner with S3 artifact storage",
        ],
        deliverables: [
          "Dockerfile + docker-compose.yml with health checks",
          ".github/workflows/ci.yml pipeline configuration",
          "Live deployed URL or Terraform/CloudFormation IaC definition",
        ],
        evidenceTarget: "Green GitHub Actions build badge and AWS deployment verification",
      },
    ],
    expectedEvidence: [
      {
        category: "Infrastructure & DevOps",
        artifact: "Multi-stage Dockerfile (<140MB) and docker-compose.yml with Redis & Postgres health checks",
        verificationMethod: "Container build inspection and local multi-service startup audit",
        targetMetric: "Image size < 150MB, zero root-privileged container execution",
      },
      {
        category: "Testing & Verification",
        artifact: "Automated Vitest & Supertest test suite with mocked Redis/Postgres test fixtures",
        verificationMethod: "CI automated test runner execution with coverage reporting",
        targetMetric: ">80% branch test coverage across domain logic and API routes",
      },
      {
        category: "Benchmarking & Observability",
        artifact: "Redis cache-aside performance report and k6 load testing script",
        verificationMethod: "Benchmarking p95 response latency under 500 concurrent requests",
        targetMetric: "Sub-50ms p95 latency on cached task dashboard reads",
      },
      {
        category: "Infrastructure & DevOps",
        artifact: "GitHub Actions CI pipeline (.github/workflows/ci.yml) with automated test and build steps",
        verificationMethod: "Public repository commit verification and status badge",
        targetMetric: "100% automated test run pass rate on pull request triggers",
      },
    ],
  });

  // Project 2: High-Throughput Real-Time Event & Notification Pipeline
  const proj2Gaps = targetGaps.filter((g) => {
    const l = normalize(g);
    return (
      l.includes("redis") ||
      l.includes("docker") ||
      l.includes("test") ||
      l.includes("aws") ||
      l.includes("kafka") ||
      l.includes("microservice") ||
      l.includes("graphql")
    );
  });
  if (proj2Gaps.length === 0) {
    proj2Gaps.push("Redis", "Docker", "Testing");
  }

  projects.push({
    id: "proj-event-pipeline",
    title: "High-Throughput Real-Time Event & Telemetry Ingestion Pipeline",
    whyRelevant: `Targets your gaps in ${proj2Gaps.join(
      ", "
    )} by constructing an event-driven system capable of processing streaming ingestion, rate-limiting, and distributed dispatching without data loss.`,
    targetedGaps: proj2Gaps,
    skillsDemonstrated: Array.from(
      new Set([
        ...existingSkills.filter((s) => ["Node.js", "TypeScript"].includes(s)),
        ...proj2Gaps,
        "Node.js",
        "TypeScript",
        "Redis",
        "Docker",
        "Testing",
        "AWS",
      ])
    ),
    difficulty: "Advanced",
    estimatedDuration: "2 weeks",
    suggestedStack: [
      {
        category: "Ingestion Engine",
        technologies: ["Node.js", "Fastify", "TypeScript"],
      },
      {
        category: "Event Streaming & Buffer",
        technologies: ["Redis Streams / BullMQ", "Redis Pub/Sub"],
      },
      {
        category: "Storage",
        technologies: ["TimescaleDB / PostgreSQL", "Redis TimeSeries"],
      },
      {
        category: "DevOps & Containers",
        technologies: ["Docker", "Docker Compose", "AWS ECS / S3"],
      },
      {
        category: "Testing & Profiling",
        technologies: ["Vitest", "k6 (Load Testing)", "Autocannon"],
      },
    ],
    features: [
      "High-performance HTTP event ingestion endpoint achieving >2,500 req/sec via Fastify",
      "Redis Streams consumer group architecture with automatic message acknowledgment and consumer rebalancing",
      "Sliding-window distributed rate limiter using Redis Lua scripts to protect downstream consumers",
      "Comprehensive integration test suite simulating partition failures and message replay",
      "Dockerized deployment with Prometheus metrics exporter for queue lag and ingestion latency",
    ],
    architecture: {
      pattern: "Event-Driven Stream Ingestion Architecture",
      overview:
        "Decouples ingestion from processing using Redis Streams. Ingestion gateways acknowledge receipt in <10ms, appending events to a stream. Independent worker consumer groups batch process records into PostgreSQL.",
      components: [
        {
          name: "Fastify Ingestion Gateway",
          role: "Validates JSON schemas, enforces sliding-window rate limits, and appends to Redis Stream.",
          technologies: ["Fastify", "TypeScript", "Redis Streams"],
        },
        {
          name: "Consumer Group Workers",
          role: "Reads batches from Redis Stream using XREADGROUP, performs enrichment, and writes to TimescaleDB/PostgreSQL.",
          technologies: ["Node.js", "ioredis", "Prisma"],
        },
        {
          name: "Observability Exporter",
          role: "Exposes Prometheus metrics for stream depth, consumer lag, and ingestion throughput.",
          technologies: ["prom-client", "Docker"],
        },
      ],
      dataFlow: [
        "1. Client pushes telemetry payload to POST /events.",
        "2. Gateway validates payload with schema and runs sliding-window Lua rate limiter in Redis.",
        "3. Gateway appends event to Redis Stream 'stream:events' and returns 202 Accepted.",
        "4. Consumer Worker group polls stream, batches 50 records, and persists to database.",
        "5. Worker calls XACK to confirm processing.",
      ],
      storageAndCaching:
        "Redis Streams acts as an in-memory persistent buffer. PostgreSQL stores indexed historical records.",
      containerizationAndDeployment:
        "Packaged in Docker with Compose service orchestration. Ready for AWS ECS Fargate deployment.",
    },
    milestones: [
      {
        milestoneNumber: 1,
        title: "Fastify Gateway & Redis Streams Setup",
        duration: "3 days",
        objectives: ["Build fast HTTP ingestion route", "Set up Redis Streams and XADD pipelines"],
        deliverables: ["Ingestion service with schema validation"],
        evidenceTarget: "Local benchmarks proving >2,000 req/s throughput",
      },
      {
        milestoneNumber: 2,
        title: "Consumer Group Engine & Database Persistence",
        duration: "4 days",
        objectives: ["Implement XREADGROUP batch consumer", "Handle worker crash recovery with XPENDING"],
        deliverables: ["Resilient consumer worker service"],
        evidenceTarget: "Zero dropped messages under simulated worker kill tests",
      },
      {
        milestoneNumber: 3,
        title: "Automated Testing & k6 Load Benchmarking",
        duration: "3 days",
        objectives: ["Write Vitest integration test suite", "Author k6 load script measuring p95 and p99 latency"],
        deliverables: ["Full test suite and k6 performance report"],
        evidenceTarget: "p95 latency < 25ms under sustained 1,000 req/s load",
      },
      {
        milestoneNumber: 4,
        title: "Docker Compose & AWS CI/CD Pipeline",
        duration: "3 days",
        objectives: ["Dockerize all services", "Create automated GitHub Actions test and image build"],
        deliverables: ["Docker compose topology and GitHub Actions workflow"],
        evidenceTarget: "Passing CI pipeline with clean image vulnerability scan",
      },
    ],
    expectedEvidence: [
      {
        category: "Code & Architecture",
        artifact: "Redis Streams consumer worker implementation with crash recovery logic",
        verificationMethod: "Code review and simulated worker crash integration test",
        targetMetric: "Zero data loss across consumer node restarts",
      },
      {
        category: "Testing & Verification",
        artifact: "k6 load testing script and benchmark results markdown report",
        verificationMethod: "Automated load test execution against Dockerized environment",
        targetMetric: ">2,000 requests/sec with p95 < 30ms",
      },
      {
        category: "Infrastructure & DevOps",
        artifact: "Dockerfile and docker-compose.yml running gateway, worker, and Redis",
        verificationMethod: "Single-command local reproduction via 'docker compose up'",
        targetMetric: "100% reproducible local environment",
      },
    ],
  });

  // Project 3: Cloud-Native Microservices API Gateway with Distributed RBAC & Rate Limiting
  const proj3Gaps = targetGaps.filter((g) => {
    const l = normalize(g);
    return (
      l.includes("docker") ||
      l.includes("aws") ||
      l.includes("test") ||
      l.includes("security") ||
      l.includes("redis")
    );
  });
  if (proj3Gaps.length === 0) {
    proj3Gaps.push("Docker", "AWS", "Testing");
  }

  projects.push({
    id: "proj-api-gateway",
    title: "Cloud-Native API Gateway & Distributed Authorization Service",
    whyRelevant: `Solidifies your gaps in ${proj3Gaps.join(
      ", "
    )} by creating an infrastructure-level service that demonstrates production security, Docker networking, Redis token bucket rate-limiting, and AWS deployment.`,
    targetedGaps: proj3Gaps,
    skillsDemonstrated: Array.from(
      new Set([
        ...existingSkills.filter((s) => ["Node.js", "TypeScript"].includes(s)),
        ...proj3Gaps,
        "Node.js",
        "TypeScript",
        "Docker",
        "Redis",
        "Testing",
        "AWS",
      ])
    ),
    difficulty: "Production-Grade",
    estimatedDuration: "2 weeks",
    suggestedStack: [
      {
        category: "Gateway Core",
        technologies: ["Node.js", "TypeScript", "Express / Fastify HTTP Proxy"],
      },
      {
        category: "Rate Limiting & Token Cache",
        technologies: ["Redis 7 (Lua Scripting)", "ioredis"],
      },
      {
        category: "Security & Auth",
        technologies: ["JSON Web Tokens (JWT)", "JWKS / Asymmetric RSA256", "Argon2"],
      },
      {
        category: "DevOps & Cloud",
        technologies: ["Docker", "Docker Compose", "AWS ECS", "AWS CloudWatch"],
      },
      {
        category: "Testing",
        technologies: ["Vitest", "Supertest", "k6"],
      },
    ],
    features: [
      "Distributed Token Bucket Rate Limiting executed atomically via Redis Lua scripts",
      "Asymmetric JWT Verification with JWKS public key caching and automatic key rotation",
      "Dynamic Reverse Proxying and upstream health check circuit breakers",
      "Comprehensive Supertest test suite with simulated malicious flood attacks and expired token rejection",
      "Production Docker container with non-root security privileges and AWS CloudWatch logging",
    ],
    architecture: {
      pattern: "Edge Proxy & Distributed Policy Enforcement Architecture",
      overview:
        "Intercepts all incoming client requests, verifies authentication headers, enforces tenant quotas in Redis, and proxies valid requests to downstream microservices with appended user context headers.",
      components: [
        {
          name: "Edge Proxy Interceptor",
          role: "Terminates HTTP connections, verifies SSL/TLS, and routes to policy filters.",
          technologies: ["Fastify / Express", "http-proxy-middleware"],
        },
        {
          name: "Redis Policy & Quota Store",
          role: "Atomic token bucket tracking and blacklisted token revocation list.",
          technologies: ["Redis 7", "Lua Scripts"],
        },
        {
          name: "Upstream Service Mock / Handlers",
          role: "Downstream microservices receiving authenticated and rate-checked requests.",
          technologies: ["Node.js", "Docker Network"],
        },
      ],
      dataFlow: [
        "1. Request arrives at Gateway with Bearer token.",
        "2. Gateway validates signature against cached JWKS.",
        "3. Redis Lua script checks and decrements user token bucket; if depleted, returns 429 Too Many Requests.",
        "4. Gateway appends `X-User-Id` and `X-Tenant-Id` headers and proxies to upstream service.",
      ],
      storageAndCaching:
        "Redis 7 handles high-speed ephemeral counters and revoked token blacklist with TTL.",
      containerizationAndDeployment:
        "Multi-stage Docker container configured with non-root user. Deployed on AWS ECS.",
    },
    milestones: [
      {
        milestoneNumber: 1,
        title: "Proxy Interceptor & JWT Validation",
        duration: "3 days",
        objectives: ["Build proxy routing core", "Implement RSA256 JWT validation"],
        deliverables: ["Secure reverse proxy gateway"],
        evidenceTarget: "Unit tests verifying valid and expired token behavior",
      },
      {
        milestoneNumber: 2,
        title: "Redis Lua Rate Limiting & Revocation",
        duration: "4 days",
        objectives: ["Write atomic Token Bucket script in Lua", "Implement token revocation blacklist"],
        deliverables: ["Distributed rate limiter with test suite"],
        evidenceTarget: "Supertest suite testing 429 rate limit triggers",
      },
      {
        milestoneNumber: 3,
        title: "Testing, Containerization & CI/CD",
        duration: "4 days",
        objectives: ["Write full test suite", "Build Docker image and GitHub Actions CI workflow"],
        deliverables: ["Dockerfile and automated CI pipeline"],
        evidenceTarget: "Passing CI build with >85% test coverage",
      },
    ],
    expectedEvidence: [
      {
        category: "Code & Architecture",
        artifact: "Atomic Redis Token Bucket Lua script and rate-limiting middleware",
        verificationMethod: "Code inspection and unit test verifying concurrency safety",
        targetMetric: "Zero race conditions under concurrent burst testing",
      },
      {
        category: "Testing & Verification",
        artifact: "Supertest test suite testing security edge cases and quota exhaustion",
        verificationMethod: "Automated test execution in GitHub Actions",
        targetMetric: ">85% branch coverage on auth and proxy filters",
      },
      {
        category: "Infrastructure & DevOps",
        artifact: "Multi-stage Dockerfile and docker-compose service mesh",
        verificationMethod: "Local docker compose execution with upstream mock services",
        targetMetric: "Image size < 120MB, unprivileged container execution",
      },
    ],
  });

  const report: ProjectRecommendationReport = {
    id: `proj-rec-${Date.now()}`,
    targetRole,
    targetCompany,
    generatedAt: new Date().toISOString(),
    analyzedGapsCount: targetGaps.length,
    targetedGapSkills: targetGaps,
    existingStrongSkills: existingSkills,
    projects,
  };

  return projectRecommendationReportSchema.parse(report);
}

/**
 * Phase 10: Generates an in-depth Project Blueprint with full system topology,
 * database schema draft, API specs, production code templates, and verification checklist.
 */
export function generateProjectBlueprint(project: RecommendedProject): ProjectBlueprint {
  const isWorkflow = project.id.includes("workflow");
  const isPipeline = project.id.includes("pipeline");

  const blueprint: ProjectBlueprint = {
    id: `blueprint-${project.id}-${Date.now()}`,
    projectId: project.id,
    projectTitle: project.title,
    generatedAt: new Date().toISOString(),
    summary: `Complete engineering specification and execution blueprint for ${project.title}. Designed specifically to address your gap requirements (${project.targetedGaps.join(
      ", "
    )}) through verified, production-grade code artifacts.`,
    systemTopology: isWorkflow
      ? "React Frontend Client -> Nginx / AWS ALB -> Node.js Express API (Ingress + Auth) -> PostgreSQL 16 (Primary ACID Store) + Redis 7 (Cache-aside + BullMQ Queue) -> Asynchronous BullMQ Worker Nodes -> AWS S3 (Artifacts & Output)"
      : isPipeline
      ? "Client / Device Stream -> Fastify Ingestion Gateway (Port 4000) -> Redis Streams Buffer ('stream:telemetry') -> Concurrency-Controlled Worker Consumer Groups -> PostgreSQL / TimescaleDB -> Prometheus / Grafana Metrics Exporter"
      : "Client Web / Mobile Apps -> Cloud-Native API Gateway (Port 8080) -> Redis 7 (Token Bucket Counters & Blacklist) -> Upstream Internal Services (Microservices Network)",
    apiEndpoints: isWorkflow
      ? [
          {
            method: "POST",
            path: "/api/v1/auth/login",
            description: "Authenticates candidate/user and returns JWT access + refresh tokens.",
            authRequired: false,
          },
          {
            method: "POST",
            path: "/api/v1/tasks",
            description: "Creates a new asynchronous job with idempotency key, records in PostgreSQL, and enqueues to Redis BullMQ.",
            authRequired: true,
          },
          {
            method: "GET",
            path: "/api/v1/tasks/:id",
            description: "Fetches current task status; checks Redis cache first, falling back to PostgreSQL on cache miss.",
            authRequired: true,
          },
          {
            method: "GET",
            path: "/api/v1/tasks/summary",
            description: "Returns aggregated task statistics for tenant dashboard, cached in Redis with a 60-second TTL.",
            authRequired: true,
          },
          {
            method: "POST",
            path: "/api/v1/tasks/:id/retry",
            description: "Re-queues a failed or DLQ task for re-execution with updated parameters.",
            authRequired: true,
          },
        ]
      : [
          {
            method: "POST",
            path: "/api/v1/events",
            description: "Ingests telemetry event payload, runs sliding-window rate limit, and appends to Redis Stream.",
            authRequired: true,
          },
          {
            method: "GET",
            path: "/api/v1/events/metrics",
            description: "Exposes real-time throughput, stream length, and consumer lag metrics.",
            authRequired: true,
          },
          {
            method: "GET",
            path: "/health",
            description: "Container health check endpoint verifying Redis and DB connectivity.",
            authRequired: false,
          },
        ],
    databaseSchemaDraft: [
      {
        tableName: "tasks",
        purpose: "Stores master task definitions, execution parameters, and final output references.",
        keyFields: [
          "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
          "tenant_id UUID NOT NULL REFERENCES tenants(id)",
          "name VARCHAR(255) NOT NULL",
          "status VARCHAR(50) NOT NULL DEFAULT 'PENDING'",
          "payload JSONB NOT NULL",
          "result JSONB",
          "created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
          "updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
        ],
        indexes: [
          "CREATE INDEX idx_tasks_tenant_status ON tasks(tenant_id, status);",
          "CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);",
        ],
      },
      {
        tableName: "task_audit_logs",
        purpose: "Immutable audit log tracking every state transition and worker retry.",
        keyFields: [
          "id BIGSERIAL PRIMARY KEY",
          "task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE",
          "from_status VARCHAR(50)",
          "to_status VARCHAR(50) NOT NULL",
          "worker_id VARCHAR(100)",
          "recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
        ],
        indexes: ["CREATE INDEX idx_audit_task_id ON task_audit_logs(task_id);"],
      },
    ],
    securityPractices: [
      "Enforce non-root user execution in Docker container (USER node / UID 10001).",
      "Store all secrets, DB passwords, and AWS credentials in environment variables or AWS Systems Manager Parameter Store.",
      "Input validation on 100% of API ingress routes using strict Zod schemas.",
      "Implement atomic Redis Token Bucket rate limiting to protect against brute-force and DoS attacks.",
      "CORS configuration restricting origins to verified frontend domain.",
    ],
    codeTemplates: [
      {
        filename: "Dockerfile",
        language: "dockerfile",
        description: "Optimized multi-stage production Dockerfile with non-root security user (<140MB).",
        content: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
USER appuser
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost:4000/health || exit 1
CMD ["node", "dist/index.js"]`,
      },
      {
        filename: "docker-compose.yml",
        language: "yaml",
        description: "Complete local development and testing environment with Redis 7 and PostgreSQL 16.",
        content: `version: "3.8"
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - NODE_ENV=development
      - DATABASE_URL=postgresql://app:secret@postgres:5432/taskdb?sslmode=disable
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    command: ["node", "dist/worker.js"]
    environment:
      - DATABASE_URL=postgresql://app:secret@postgres:5432/taskdb?sslmode=disable
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: taskdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d taskdb"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:`,
      },
      {
        filename: "src/services/cacheService.ts",
        language: "typescript",
        description: "Production Redis cache-aside implementation with TTL and stampede prevention.",
        content: `import { Redis } from "ioredis";

export class CacheService {
  constructor(private readonly redis: Redis) {}

  /**
   * Cache-Aside get-or-set helper with deterministic TTL.
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const freshData = await fetcher();
    if (freshData !== undefined && freshData !== null) {
      await this.redis.set(key, JSON.stringify(freshData), "EX", ttlSeconds);
    }
    return freshData;
  }

  /**
   * Invalidate one or more keys matching a pattern.
   */
  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}`,
      },
      {
        filename: "src/__tests__/taskService.test.ts",
        language: "typescript",
        description: "Automated Vitest integration test suite proving >80% test coverage and Redis caching behavior.",
        content: `import { describe, it, expect, beforeEach, vi } from "vitest";
import { CacheService } from "../services/cacheService";

describe("CacheService & Task Workflow Integration", () => {
  let mockRedis: any;
  let cacheService: CacheService;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
    cacheService = new CacheService(mockRedis);
  });

  it("should return cached item without invoking fetcher on cache hit", async () => {
    const cachedPayload = { id: "task-123", status: "COMPLETED" };
    mockRedis.get.mockResolvedValue(JSON.stringify(cachedPayload));
    const fetcher = vi.fn();

    const result = await cacheService.getOrSet("task:task-123", 60, fetcher);

    expect(result).toEqual(cachedPayload);
    expect(mockRedis.get).toHaveBeenCalledWith("task:task-123");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("should invoke fetcher and cache result on cache miss", async () => {
    mockRedis.get.mockResolvedValue(null);
    const freshPayload = { id: "task-456", status: "PENDING" };
    const fetcher = vi.fn().mockResolvedValue(freshPayload);

    const result = await cacheService.getOrSet("task:task-456", 60, fetcher);

    expect(result).toEqual(freshPayload);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(mockRedis.set).toHaveBeenCalledWith(
      "task:task-456",
      JSON.stringify(freshPayload),
      "EX",
      60
    );
  });
});`,
      },
    ],
    verificationChecklist: [
      {
        task: "Verify Multi-Stage Docker Container Build",
        proofArtifact: "Local image build output under 150MB",
        verificationCommand: "docker build -t task-platform:latest . && docker images task-platform:latest",
      },
      {
        task: "Verify Multi-Service Orchestration",
        proofArtifact: "Clean health checks across API, Worker, Redis, and Postgres",
        verificationCommand: "docker compose up -d && docker compose ps",
      },
      {
        task: "Verify Automated Unit & Integration Tests",
        proofArtifact: "Vitest test report with >80% branch coverage",
        verificationCommand: "pnpm test -- --coverage",
      },
      {
        task: "Verify End-to-End Task Ingestion & Worker Processing",
        proofArtifact: "Task transitions from PENDING to COMPLETED in database",
        verificationCommand: "curl -X POST http://localhost:4000/api/v1/tasks -H 'Content-Type: application/json' -d '{\"name\":\"Demo Job\"}'",
      },
    ],
    resumeBulletPoints: [
      `Architected and deployed a production-grade asynchronous task platform using Node.js, TypeScript, Docker, and AWS, handling concurrent job execution via BullMQ and Redis 7.`,
      `Engineered a Redis cache-aside layer and distributed rate limiter, reducing p95 database query latency from 240ms to under 35ms on active tenant dashboards.`,
      `Implemented automated test suites with Vitest and Supertest achieving >85% code coverage, with multi-stage Docker CI workflows enforcing automated container scans on pull requests.`,
    ],
  };

  return projectBlueprintSchema.parse(blueprint);
}
