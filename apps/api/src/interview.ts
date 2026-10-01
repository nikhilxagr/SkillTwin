import type { InterviewEvaluation, InterviewSession } from "@skilltwin/contracts";
import { roles } from "./roles.js";

export const demoInterview: InterviewSession = {
  id: "demo-interview-full-stack",
  role: roles[0],
  questions: [
    {
      id: "q-react-architecture",
      question: "In your React project, how did you decide where state should live, and what tradeoffs did that create?",
      focusSkill: "React",
      projectContext: "React project with reusable components and client-side state.",
      whyThisQuestion: "Tests whether implementation evidence is backed by design understanding.",
    },
    {
      id: "q-node-auth",
      question: "Walk through how you would secure authentication in your Node.js API. What would you validate and where?",
      focusSkill: "Node.js",
      projectContext: "REST API with authentication signals.",
      whyThisQuestion: "Connects observed API activity to security and boundary decisions.",
    },
    {
      id: "q-testing-gap",
      question: "What would you test first in your current project, and why would those tests provide the most confidence?",
      focusSkill: "Testing",
      projectContext: "Current snapshot has limited testing evidence.",
      whyThisQuestion: "Turns a missing-evidence gap into a practical reasoning exercise.",
    },
  ],
  disclaimer: "Interview feedback evaluates this answer only. It does not independently verify proficiency or replace repository evidence.",
};

export function evaluateDemoAnswer(answer: string): InterviewEvaluation {
  const normalized = answer.trim();
  const hasReasoning = /because|tradeoff|consider|validate|test|security|performance/i.test(normalized);
  const hasDetail = normalized.length >= 120;
  const score = (base: number) => Math.min(5, base + (hasReasoning ? 1 : 0) + (hasDetail ? 1 : 0));
  return {
    technicalUnderstanding: score(2),
    accuracy: score(2),
    depth: score(1),
    communication: score(2),
    feedback: hasDetail
      ? "Your answer includes enough detail to discuss a concrete engineering decision."
      : "Add a concrete example, the decision tradeoff, and how you would validate the outcome.",
    followUp: "What evidence from a real project would help you defend that decision in an interview?",
    evidenceNote: "This response may guide follow-up questions, but it is not stored as verified skill evidence.",
  };
}
