import { z } from "zod";

export const simulatorQuestionTypeSchema = z.enum([
  "technical",
  "project",
  "behavioral",
  "role_specific",
  "follow_up",
]);
export type SimulatorQuestionType = z.infer<typeof simulatorQuestionTypeSchema>;

export const simulatorQuestionSchema = z.object({
  id: z.string().min(1),
  type: simulatorQuestionTypeSchema,
  question: z.string().min(1),
  context: z.string().min(1),
  focusSkill: z.string().optional(),
  relatedProject: z.string().optional(),
  whyAsked: z.string().min(1),
  expectedKeyPoints: z.array(z.string()),
});
export type SimulatorQuestion = z.infer<typeof simulatorQuestionSchema>;

export const simulatorAnswerEvaluationSchema = z.object({
  technicalAccuracy: z.number().min(0).max(100),
  depth: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  projectUnderstanding: z.number().min(0).max(100),
  conciseFeedback: z.string().min(1),
  strengthsObserved: z.array(z.string()),
  areasToImprove: z.array(z.string()),
  followUpQuestion: z.string().optional(),
});
export type SimulatorAnswerEvaluation = z.infer<typeof simulatorAnswerEvaluationSchema>;

export const simulatorExchangeSchema = z.object({
  id: z.string().min(1),
  step: z.number().int().min(1),
  question: simulatorQuestionSchema,
  answer: z.string(),
  evaluation: simulatorAnswerEvaluationSchema,
  timestamp: z.string().datetime(),
});
export type SimulatorExchange = z.infer<typeof simulatorExchangeSchema>;

export const simulatorDimensionScoreSchema = z.object({
  score: z.number().min(0).max(100),
  rating: z.enum(["Excellent", "Proficient", "Adequate", "Needs Improvement"]),
  summary: z.string().min(1),
});
export type SimulatorDimensionScore = z.infer<typeof simulatorDimensionScoreSchema>;

export const simulatorFinalReportSchema = z.object({
  sessionId: z.string().min(1),
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  overallRating: z.enum(["Strong Hire", "Hire", "Leaning Hire", "Needs More Evidence"]),
  summary: z.string().min(1),
  technicalAccuracy: simulatorDimensionScoreSchema,
  depth: simulatorDimensionScoreSchema,
  communication: simulatorDimensionScoreSchema,
  projectUnderstanding: simulatorDimensionScoreSchema,
  strengths: z.array(z.string()),
  areasToImprove: z.array(z.string()),
  actionableRecommendations: z.array(z.string()),
  exchanges: z.array(simulatorExchangeSchema),
  completedAt: z.string().datetime(),
});
export type SimulatorFinalReport = z.infer<typeof simulatorFinalReportSchema>;

export const interviewSessionStateSchema = z.object({
  id: z.string().min(1),
  resumeId: z.string().min(1),
  jobId: z.string().min(1),
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  status: z.enum(["in_progress", "completed"]),
  currentStepIndex: z.number().int().min(0),
  totalSteps: z.number().int().min(1),
  currentQuestion: simulatorQuestionSchema.nullable(),
  plannedQuestions: z.array(simulatorQuestionSchema),
  exchanges: z.array(simulatorExchangeSchema),
  finalReport: simulatorFinalReportSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type InterviewSessionState = z.infer<typeof interviewSessionStateSchema>;

export const interviewHistoryItemSchema = z.object({
  id: z.string().min(1),
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  status: z.enum(["in_progress", "completed"]),
  overallScore: z.number().min(0).max(100).nullable(),
  completedQuestionsCount: z.number().int().min(0),
  totalQuestionsCount: z.number().int().min(1),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});
export type InterviewHistoryItem = z.infer<typeof interviewHistoryItemSchema>;

export const startInterviewRequestSchema = z.object({
  resumeId: z.string().optional(),
  jobId: z.string().optional(),
  customQuestionsCount: z.number().int().min(2).max(10).optional(),
});
export type StartInterviewRequest = z.infer<typeof startInterviewRequestSchema>;

export const submitAnswerRequestSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.string().min(1, "Answer cannot be empty"),
});
export type SubmitAnswerRequest = z.infer<typeof submitAnswerRequestSchema>;

export const completeInterviewRequestSchema = z.object({
  sessionId: z.string().min(1),
});
export type CompleteInterviewRequest = z.infer<typeof completeInterviewRequestSchema>;
