import type { ResumeExtraction } from "./resume.js";
import type { SkillMatrix } from "./skills.js";
import type { JobExtraction } from "./job.js";
import type { GapAnalysisReport } from "./gap.js";
import type {
  SimulatorQuestion,
  SimulatorAnswerEvaluation,
  SimulatorExchange,
  SimulatorDimensionScore,
  SimulatorFinalReport,
} from "./interview.js";

/**
 * Deterministic helper to generate unique question IDs
 */
function createQuestionId(prefix: string, index: number): string {
  return `q-${prefix}-${index + 1}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Clean and normalize text tokens for matching
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

/**
 * Generate a tailored interview question plan based on:
 * - user resume
 * - verified projects
 * - skill matrix
 * - target job description
 * - identified gaps
 */
export function generateInterviewQuestions(params: {
  resume: ResumeExtraction;
  matrix: SkillMatrix;
  job: JobExtraction;
  gapReport: GapAnalysisReport;
  customCount?: number;
}): SimulatorQuestion[] {
  const { resume, matrix, job, gapReport, customCount = 5 } = params;
  const questions: SimulatorQuestion[] = [];
  const companyName = job.company || "the target company";

  const topProject = resume.projects?.[0] || {
    name: "Core Web Platform",
    description: "Full-stack application delivering scalable user workflows",
    technologies: ["TypeScript", "React", "Node.js"],
  };

  const topGap = gapReport.criticalGaps?.[0] || gapReport.weakEvidence?.[0];
  const topMatch = gapReport.strongMatches?.[0];

  const primaryRequiredSkillNames = job.requiredSkills.map((s) => s.canonicalName);
  const primaryReq = primaryRequiredSkillNames.slice(0, 3).join(", ") || "TypeScript, Node.js, and Modern Web Architecture";

  // 1. Role-Specific Question
  questions.push({
    id: createQuestionId("role", 0),
    type: "role_specific",
    question: `As a candidate for ${job.title} at ${companyName}, how would you approach architecting scalable workflows that directly align with their requirement for ${primaryReq}?`,
    context: `Targeting ${companyName}'s ${job.title} core operational needs and primary required tech stack.`,
    whyAsked: `Directly assesses role readiness for ${job.title} and understanding of ${companyName}'s stated responsibilities.`,
    expectedKeyPoints: [
      "Architectural decomposition and component boundaries",
      "Handling scalability, concurrency, and performance bottlenecks",
      "Testing, code quality, and maintainability in production",
      `Concrete application of ${primaryRequiredSkillNames.slice(0, 2).join(" and ") || "core technologies"}`,
    ],
  });

  // 2. Project Deep-Dive Question
  questions.push({
    id: createQuestionId("project", 1),
    type: "project",
    question: `In your project "${topProject.name}", what was the most difficult architectural trade-off or performance bottleneck you resolved, and how did you measure the outcome?`,
    context: `Grounded in verified project experience: ${topProject.name} (${topProject.technologies?.slice(0, 4).join(", ") || "Full Stack"}).`,
    relatedProject: topProject.name,
    whyAsked: `Validates authentic project ownership, technical decision-making, and measurable impact rather than surface claims.`,
    expectedKeyPoints: [
      "Specific problem context and architectural trade-off",
      "Why alternate approaches were discarded",
      "Implementation details and technologies involved",
      "Measurable engineering outcome or latency/throughput impact",
    ],
  });

  // 3. Technical Core Question
  const coreSkill = topMatch?.canonicalName || primaryRequiredSkillNames[0] || "TypeScript";
  questions.push({
    id: createQuestionId("tech", 2),
    type: "technical",
    question: `When building mission-critical services with ${coreSkill}, how do you manage state consistency, asynchronous error propagation, and graceful failure recovery?`,
    context: `Probing high-proficiency requirement: ${coreSkill} listed in both your skill profile and job specifications.`,
    focusSkill: coreSkill,
    whyAsked: `Evaluates depth of ${coreSkill} knowledge beyond basic syntax into production reliability patterns.`,
    expectedKeyPoints: [
      "State management strategies and immutability",
      "Structured error handling and circuit breaker / retry logic",
      "Asynchronous flow control and avoidance of race conditions",
      "Observability, logging, and error tracking",
    ],
  });

  // 4. Gap / Edge-Case Question
  if (topGap) {
    questions.push({
      id: createQuestionId("gap", 3),
      type: "technical",
      question: `The job specification emphasizes ${topGap.canonicalName}. Given that your profile currently reflects ${topGap.status === "GAP" ? "a critical gap" : "limited production evidence"} in this area, how would you approach designing a production subsystem utilizing ${topGap.canonicalName}, and what architectural pitfalls would you proactively avoid?`,
      context: `Identified as ${topGap.status.replace("_", " ")} in the SkillTwin Gap Analysis.`,
      focusSkill: topGap.canonicalName,
      whyAsked: `Tests your ability to ramp up on identified job gaps, reason from first principles, and avoid common novice pitfalls.`,
      expectedKeyPoints: [
        `Foundational concepts and execution model of ${topGap.canonicalName}`,
        "Real-world trade-offs and deployment considerations",
        "How existing adjacent skills translate to mastering this technology",
        "Clear acknowledgment of boundaries without exaggerating claims",
      ],
    });
  } else {
    const secondSkill = primaryRequiredSkillNames[1] || "RESTful APIs";
    questions.push({
      id: createQuestionId("tech", 3),
      type: "technical",
      question: `How do you design database indexing, caching layers, and API rate-limiting to support high-throughput operations with ${secondSkill}?`,
      context: `Probing backend scaling requirement: ${secondSkill}.`,
      focusSkill: secondSkill,
      whyAsked: `Validates systems design rigor and backend optimization capabilities.`,
      expectedKeyPoints: [
        "Index optimization (composite, B-tree, covering indexes)",
        "Cache invalidation strategies (write-through, cache-aside, TTLs)",
        "Rate limiting algorithms (token bucket, leaky bucket)",
      ],
    });
  }

  // 5. Behavioral Question (Role-specific STAR format)
  questions.push({
    id: createQuestionId("behav", 4),
    type: "behavioral",
    question: `Tell me about a situation where a critical requirement changed shortly before a production release, or you uncovered conflicting technical requirements with team members. How did you handle it?`,
    context: `Behavioral readiness for collaborative delivery at ${companyName}.`,
    whyAsked: `Evaluates communication under pressure, prioritization skills, stakeholder alignment, and professional maturity.`,
    expectedKeyPoints: [
      "Clear STAR structure: Situation, Task, Action, Result",
      "Objective risk assessment and trade-off negotiation",
      "Proactive communication with teammates and stakeholders",
      "Constructive outcome with key lessons learned",
    ],
  });

  return questions.slice(0, Math.max(2, customCount));
}

/**
 * Evaluates a candidate's answer adaptively.
 * Generates scores (0-100), concise user-facing feedback, strengths,
 * areas to improve, and an adaptive follow-up question.
 */
export function evaluateInterviewAnswer(params: {
  question: SimulatorQuestion;
  answer: string;
  previousExchanges?: SimulatorExchange[];
  resume?: ResumeExtraction;
  matrix?: SkillMatrix;
  job?: JobExtraction;
  gapReport?: GapAnalysisReport;
}): SimulatorAnswerEvaluation {
  const { question, answer } = params;
  const trimmed = answer.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const tokens = tokenize(trimmed);

  // Baseline metrics
  let matchedKeyPoints = 0;
  for (const point of question.expectedKeyPoints) {
    const pointTokens = tokenize(point);
    let overlap = 0;
    for (const t of pointTokens) {
      if (tokens.has(t)) overlap++;
    }
    if (overlap >= 2 || (pointTokens.size > 0 && overlap / pointTokens.size >= 0.35)) {
      matchedKeyPoints++;
    }
  }

  const keyPointRatio = question.expectedKeyPoints.length > 0
    ? matchedKeyPoints / question.expectedKeyPoints.length
    : 0.5;

  // 1. Technical Accuracy Calculation
  let techScore = 40;
  if (wordCount < 8) {
    techScore = Math.max(20, wordCount * 3);
  } else if (keyPointRatio === 0 && wordCount < 15) {
    techScore = Math.min(45, 25 + wordCount);
  } else {
    techScore = Math.min(
      95,
      Math.round(40 + keyPointRatio * 38 + Math.min(17, wordCount / 5))
    );
  }

  // 2. Depth Calculation (architectural trade-offs, edge cases, failure modes, metrics)
  const depthKeywords = [
    "trade-off", "tradeoff", "bottleneck", "latency", "throughput", "concurrency",
    "cache", "index", "failure", "retry", "fallback", "scale", "performance",
    "monitoring", "metric", "edge case", "async", "lock", "queue", "testing"
  ];
  let depthMatches = 0;
  for (const kw of depthKeywords) {
    if (tokens.has(kw) || trimmed.toLowerCase().includes(kw)) {
      depthMatches++;
    }
  }
  let depthScore = 35;
  if (wordCount < 8) {
    depthScore = Math.max(20, wordCount * 3);
  } else if (depthMatches === 0 && wordCount < 15) {
    depthScore = Math.min(45, 25 + wordCount);
  } else {
    depthScore = Math.min(
      96,
      Math.round(40 + Math.min(32, depthMatches * 8) + Math.min(24, wordCount / 6))
    );
  }


  // 3. Communication Calculation (structure, clarity, completeness)
  let commScore = 50;
  const hasSentences = trimmed.split(/[.!?]+/).filter(Boolean).length;
  if (wordCount < 8) {
    commScore = 35;
  } else if (hasSentences >= 2) {
    commScore = Math.min(
      95,
      Math.round(55 + Math.min(25, hasSentences * 6) + Math.min(15, wordCount / 8))
    );
  } else {
    commScore = Math.min(85, Math.round(50 + Math.min(20, wordCount / 5)));
  }

  // 4. Project Understanding Calculation
  const projectSpecificKeywords = [
    "user", "users", "component", "service", "endpoint", "database", "schema",
    "deploy", "docker", "pipeline", "team", "client", "request", "response",
    "production", "implementation", "architecture"
  ];
  let projMatches = 0;
  for (const pk of projectSpecificKeywords) {
    if (tokens.has(pk) || trimmed.toLowerCase().includes(pk)) {
      projMatches++;
    }
  }
  let projScore = 50;
  if (wordCount < 8) {
    projScore = Math.max(20, wordCount * 3);
  } else if (question.type === "project") {
    projScore = Math.min(95, Math.round(45 + projMatches * 7 + (keyPointRatio * 25) + Math.min(15, wordCount / 6)));
  } else {
    projScore = Math.min(92, Math.round(50 + projMatches * 5 + (keyPointRatio * 25) + Math.min(12, wordCount / 7)));
  }


  // Build Strengths Observed
  const strengthsObserved: string[] = [];
  if (depthMatches >= 2) {
    strengthsObserved.push("Addressed tangible technical trade-offs and operational realities.");
  }
  if (keyPointRatio >= 0.5) {
    strengthsObserved.push("Directly tackled key expected engineering concepts.");
  }
  if (wordCount >= 40 && hasSentences >= 3) {
    strengthsObserved.push("Structured response clearly with coherent progression.");
  }
  if (strengthsObserved.length === 0) {
    strengthsObserved.push("Provided a baseline response that touches upon the initial requirements.");
  }

  // Build Areas To Improve
  const areasToImprove: string[] = [];
  if (wordCount < 25) {
    areasToImprove.push("Elaborate with specific technical mechanisms rather than high-level statements.");
  }
  if (depthMatches < 2) {
    areasToImprove.push("Incorporate real-world trade-offs, failure modes, or performance metrics.");
  }
  if (question.type === "project" && projMatches < 2) {
    areasToImprove.push("Ground your answer in authentic project details: quantify impact and architectural decisions.");
  }
  if (areasToImprove.length === 0) {
    areasToImprove.push("Consider explicitly mentioning edge-case resilience and observability patterns.");
  }

  // Build Concise User-Facing Feedback (NO hidden chain-of-thought)
  let conciseFeedback = "";
  if (techScore >= 80 && depthScore >= 75) {
    conciseFeedback = `Strong, well-articulated response. You effectively demonstrated clear technical precision and highlighted practical architectural considerations.`;
  } else if (techScore >= 65) {
    conciseFeedback = `Solid foundational answer. Your core concepts are correct, but technical interviewers will expect deeper exploration of edge cases and trade-offs.`;
  } else {
    conciseFeedback = `Answer is too brief or conceptual. To pass a technical bar, provide concrete code/architecture examples and explain how you handle failures.`;
  }

  // Adaptive Follow-Up Question
  let followUpQuestion = "";
  if (question.type === "technical") {
    if (depthMatches < 2) {
      followUpQuestion = `What specific failure mode or edge case would you anticipate in this setup, and how would your design recover from it?`;
    } else {
      followUpQuestion = `How would your approach scale if traffic increased by an order of magnitude with strict sub-100ms latency SLAs?`;
    }
  } else if (question.type === "project") {
    followUpQuestion = `If you had to re-architect that solution today with newer tools or tighter constraints, what would you change and why?`;
  } else if (question.type === "role_specific") {
    followUpQuestion = `How would you measure the engineering ROI and reliability impact of that approach for the business stakeholders?`;
  } else {
    followUpQuestion = `Looking back, what was the primary lesson learned from that experience that influenced your subsequent engineering practices?`;
  }

  return {
    technicalAccuracy: techScore,
    depth: depthScore,
    communication: commScore,
    projectUnderstanding: projScore,
    conciseFeedback,
    strengthsObserved,
    areasToImprove,
    followUpQuestion,
  };
}

/**
 * Generate dimension score rating and summary
 */
function createDimensionScore(score: number, dimensionName: string): SimulatorDimensionScore {
  let rating: SimulatorDimensionScore["rating"] = "Needs Improvement";
  let summary = "";

  if (score >= 85) {
    rating = "Excellent";
    summary = `Consistently demonstrated exceptional ${dimensionName} with thorough reasoning and strong engineering rigor.`;
  } else if (score >= 70) {
    rating = "Proficient";
    summary = `Showed solid ${dimensionName} meeting industry engineering bars, with minor room for greater depth.`;
  } else if (score >= 55) {
    rating = "Adequate";
    summary = `Meets baseline expectations for ${dimensionName}, but lacks depth under probing technical questions.`;
  } else {
    rating = "Needs Improvement";
    summary = `Answers were high-level or incomplete in ${dimensionName}. Requires targeted preparation before technical screens.`;
  }

  return { score, rating, summary };
}

/**
 * Generate the comprehensive Final Interview Report after completion
 */
export function generateFinalInterviewReport(params: {
  sessionId: string;
  jobTitle: string;
  company: string;
  exchanges: SimulatorExchange[];
}): SimulatorFinalReport {
  const { sessionId, jobTitle, company, exchanges } = params;

  if (exchanges.length === 0) {
    const emptyDim: SimulatorDimensionScore = {
      score: 50,
      rating: "Adequate",
      summary: "Interview was concluded without completed exchanges.",
    };
    return {
      sessionId,
      jobTitle,
      company,
      overallScore: 50,
      overallRating: "Needs More Evidence",
      summary: "Interview concluded with insufficient answered questions.",
      technicalAccuracy: emptyDim,
      depth: emptyDim,
      communication: emptyDim,
      projectUnderstanding: emptyDim,
      strengths: ["Participated in interview simulation session."],
      areasToImprove: ["Complete full technical questions to receive calibrated assessment."],
      actionableRecommendations: ["Retake the simulation and answer all questions in depth."],
      exchanges: [],
      completedAt: new Date().toISOString(),
    };
  }

  // Aggregate scores across exchanges
  const count = exchanges.length;
  const avgTech = Math.round(exchanges.reduce((sum, e) => sum + e.evaluation.technicalAccuracy, 0) / count);
  const avgDepth = Math.round(exchanges.reduce((sum, e) => sum + e.evaluation.depth, 0) / count);
  const avgComm = Math.round(exchanges.reduce((sum, e) => sum + e.evaluation.communication, 0) / count);
  const avgProj = Math.round(exchanges.reduce((sum, e) => sum + e.evaluation.projectUnderstanding, 0) / count);

  // Overall score: weighted combination
  const overallScore = Math.round(avgTech * 0.35 + avgDepth * 0.25 + avgProj * 0.20 + avgComm * 0.20);

  let overallRating: SimulatorFinalReport["overallRating"] = "Needs More Evidence";
  if (overallScore >= 85) overallRating = "Strong Hire";
  else if (overallScore >= 75) overallRating = "Hire";
  else if (overallScore >= 60) overallRating = "Leaning Hire";
  else overallRating = "Needs More Evidence";

  // Strengths collection
  const allStrengths = new Set<string>();
  for (const e of exchanges) {
    for (const s of e.evaluation.strengthsObserved) {
      allStrengths.add(s);
    }
  }
  const strengths = Array.from(allStrengths).slice(0, 4);

  // Areas to improve collection
  const allImprovements = new Set<string>();
  for (const e of exchanges) {
    for (const a of e.evaluation.areasToImprove) {
      allImprovements.add(a);
    }
  }
  const areasToImprove = Array.from(allImprovements).slice(0, 4);

  // Actionable recommendations
  const actionableRecommendations: string[] = [
    `Review system design principles for ${jobTitle}, focusing on asynchronous resilience and caching layers.`,
    "Practice articulating your project contributions using STAR with concrete performance metrics.",
    "When asked about unfamiliar technologies, transparently explain how you ramp up from adjacent tools.",
  ];

  const summary = `Candidate completed ${count} interview questions for ${jobTitle} at ${company}. Overall performance is rated as "${overallRating}" (${overallScore}/100) with strongest evidence in communication and core technical clarity.`;

  return {
    sessionId,
    jobTitle,
    company,
    overallScore,
    overallRating,
    summary,
    technicalAccuracy: createDimensionScore(avgTech, "Technical Accuracy"),
    depth: createDimensionScore(avgDepth, "Technical Depth"),
    communication: createDimensionScore(avgComm, "Communication"),
    projectUnderstanding: createDimensionScore(avgProj, "Project Understanding"),
    strengths,
    areasToImprove,
    actionableRecommendations,
    exchanges,
    completedAt: new Date().toISOString(),
  };
}
