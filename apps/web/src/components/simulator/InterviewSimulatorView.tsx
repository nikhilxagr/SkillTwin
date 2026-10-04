import React, { useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  History,
  RotateCcw,
  Send,
  ArrowRight,
  Target,
  Briefcase,
  HelpCircle,
  Award,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
} from "lucide-react";
import type {
  InterviewSessionState,
  InterviewHistoryItem,
  SimulatorExchange,
  ResumeExtraction,
  JobExtraction,
  SkillMatrix,
  GapAnalysisReport,
} from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface InterviewSimulatorViewProps {
  session: InterviewSessionState | null;
  history: InterviewHistoryItem[];
  resume: ResumeExtraction | null;
  job: JobExtraction | null;
  matrix: SkillMatrix | null;
  gapReport: GapAnalysisReport | null;
  onStartNewInterview: (options?: { customCount?: number }) => Promise<void>;
  onSubmitAnswer: (params: { sessionId: string; questionId: string; answer: string }) => Promise<void>;
  onSelectHistoricalSession?: (sessionId: string) => Promise<void>;
  onNavigate?: (screen: ActiveScreen) => void;
  isLoading?: boolean;
}

export const InterviewSimulatorView: React.FC<InterviewSimulatorViewProps> = ({
  session,
  history,
  resume,
  job,
  matrix,
  gapReport,
  onStartNewInterview,
  onSubmitAnswer,
  onSelectHistoricalSession,
  onNavigate,
  isLoading = false,
}) => {
  const [answerInput, setAnswerInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null);

  // Tracking current step's feedback
  // When an answer is submitted, the latest exchange from session.exchanges can be viewed as "Feedback"
  // until the user clicks "Next Question"
  const [stagedExchange, setStagedExchange] = useState<SimulatorExchange | null>(null);

  const currentQuestion = session?.currentQuestion;
  const isCompleted = session?.status === "completed";
  const exchanges = session?.exchanges || [];

  const handleAnswerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session || !currentQuestion || !answerInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitAnswer({
        sessionId: session.id,
        questionId: currentQuestion.id,
        answer: answerInput.trim(),
      });
      // The newly added exchange will be the latest in exchanges
      // We will clear the answer input
      setAnswerInput("");
    } catch (err) {
      console.error("Error submitting answer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If session updated with new exchange and stagedExchange is not set yet,
  // we check if the last exchange matches the previous question
  const latestExchange = exchanges.length > 0 ? exchanges[exchanges.length - 1] : null;
  const showFeedbackView = stagedExchange !== null;

  const handleNextQuestion = () => {
    setStagedExchange(null);
  };

  // If a new exchange just arrived from submission and user hasn't dismissed feedback
  React.useEffect(() => {
    if (latestExchange && (!stagedExchange || stagedExchange.id !== latestExchange.id)) {
      setStagedExchange(latestExchange);
    }
  }, [latestExchange?.id]);

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case "role_specific":
        return { label: "Role-Specific", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "project":
        return { label: "Project Deep-Dive", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "technical":
        return { label: "Technical Architecture", color: "bg-slate-100 text-slate-800 border-slate-300" };
      case "behavioral":
        return { label: "Behavioral STAR", color: "bg-amber-100 text-amber-800 border-amber-200" };
      case "follow_up":
        return { label: "Adaptive Follow-Up", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      default:
        return { label: "Interview Question", color: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "Strong Hire":
      case "Excellent":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Hire":
      case "Proficient":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Leaning Hire":
      case "Adequate":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" data-testid="interview-simulator-view">
      {/* Top Header & Session Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
              Phase 9
            </span>
            <span className="text-xs font-mono text-slate-500">
              Session ID: {session?.id || "None"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Interview Simulator</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Grounded in verified resume achievements, verified projects, target job description, and identified gaps.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            data-testid="btn-interview-history"
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <History size={14} />
            <span>Interview History ({history.length})</span>
          </button>

          <button
            type="button"
            data-testid="btn-restart-interview"
            disabled={isLoading || isSubmitting}
            onClick={() => onStartNewInterview({ customCount: 5 })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={14} />
            <span>New Simulation</span>
          </button>
        </div>
      </div>

      {/* Target Role & Session Progress Banner */}
      {session && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-slate-700">
                <Briefcase size={14} className="text-blue-600" />
                <span className="font-semibold">{session.jobTitle}</span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="text-slate-600 font-medium">
                Company: <span className="text-slate-900">{session.company}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">
                {isCompleted ? "Status: Completed" : `Progress: Step ${session.currentStepIndex + 1} of ${session.totalSteps}`}
              </span>
              <div className="w-24 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.round(
                      (session.exchanges.length / Math.max(1, session.totalSteps)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE FLOW: Question -> Answer -> Feedback -> Next Question */}
      {!isCompleted && currentQuestion && (
        <div className="space-y-6">
          {/* 1. QUESTION SECTION */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm" data-testid="question-card">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getQuestionTypeBadge(currentQuestion.type).color}`}>
                  {getQuestionTypeBadge(currentQuestion.type).label}
                </span>
                {currentQuestion.focusSkill && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
                    Skill: {currentQuestion.focusSkill}
                  </span>
                )}
                {currentQuestion.relatedProject && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-purple-50 text-purple-700 border border-purple-200">
                    Project: {currentQuestion.relatedProject}
                  </span>
                )}
              </div>

              <span className="text-xs text-slate-500 font-mono">
                Q{session.currentStepIndex + 1}
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-semibold text-slate-900 leading-snug">
              {currentQuestion.question}
            </h2>

            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-1.5">
                <Target size={13} className="text-blue-600" />
                <span><strong className="text-slate-700">Why asked:</strong> {currentQuestion.whyAsked}</span>
              </div>
              <div className="text-slate-400 italic">
                {currentQuestion.context}
              </div>
            </div>
          </div>

          {/* 2. ANSWER SECTION (If feedback for current question is not showing) */}
          {!showFeedbackView && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm" data-testid="answer-card">
              <label htmlFor="answer-input" className="block text-sm font-semibold text-slate-800 mb-2">
                Your Answer
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Provide a structured, concrete response. Address technical mechanisms, architectural trade-offs, and failure recovery patterns.
              </p>

              <textarea
                id="answer-input"
                data-testid="interview-answer-input"
                rows={6}
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Structure your answer with problem context, architectural decisions, technical trade-offs, and measurable outcomes..."
                className="w-full p-3.5 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-sans leading-relaxed resize-y"
              />

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-mono">
                  {answerInput.trim().split(/\s+/).filter(Boolean).length} words
                </div>

                <button
                  type="button"
                  data-testid="btn-submit-answer"
                  disabled={!answerInput.trim() || isSubmitting}
                  onClick={() => handleAnswerSubmit()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? "Evaluating Answer..." : "Submit Answer"}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. FEEDBACK SECTION (Visible after answer submission) */}
          {showFeedbackView && stagedExchange && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5" data-testid="feedback-card">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Answer Evaluation</h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Step {stagedExchange.step} of {session.totalSteps}
                </span>
              </div>

              {/* Dimension Score Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                  <div className="text-xs text-slate-500 font-medium">Technical Accuracy</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {stagedExchange.evaluation.technicalAccuracy}%
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                  <div className="text-xs text-slate-500 font-medium">Technical Depth</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {stagedExchange.evaluation.depth}%
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                  <div className="text-xs text-slate-500 font-medium">Communication</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {stagedExchange.evaluation.communication}%
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                  <div className="text-xs text-slate-500 font-medium">Project Grounding</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {stagedExchange.evaluation.projectUnderstanding}%
                  </div>
                </div>
              </div>

              {/* Concise User-Facing Feedback (No Chain-of-Thought) */}
              <div className="bg-blue-50/60 border border-blue-100 rounded p-3.5 text-xs text-slate-700 leading-relaxed">
                <strong className="text-blue-900 block mb-1">Interviewer Feedback:</strong>
                {stagedExchange.evaluation.conciseFeedback}
              </div>

              {/* Strengths & Areas to Improve */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Strengths Observed</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                    {stagedExchange.evaluation.strengthsObserved.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Areas to Improve</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                    {stagedExchange.evaluation.areasToImprove.map((ai, i) => (
                      <li key={i}>{ai}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Adaptive Follow-up Prompt Note */}
              {stagedExchange.evaluation.followUpQuestion && (
                <div className="p-3 bg-slate-50 border-l-2 border-blue-600 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Adaptive Probe for Next Round: </span>
                  {stagedExchange.evaluation.followUpQuestion}
                </div>
              )}

              {/* 4. NEXT QUESTION ACTION */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  data-testid="btn-next-question"
                  onClick={handleNextQuestion}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <span>{session.currentStepIndex + 1 < session.totalSteps ? "Next Question" : "View Final Evaluation"}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FINAL REPORT VIEW (When Interview Session is Completed) */}
      {isCompleted && session?.finalReport && (
        <div className="space-y-6" data-testid="final-report-view">
          {/* Executive Rating Banner */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  Simulation Outcome
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Interview Evaluation Report</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Target: {session.finalReport.jobTitle} at {session.finalReport.company}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Overall Readiness</div>
                  <div className="text-3xl font-extrabold text-blue-600">
                    {session.finalReport.overallScore}/100
                  </div>
                </div>

                <div className={`px-3 py-1.5 rounded text-xs font-bold border ${getRatingBadge(session.finalReport.overallRating)}`}>
                  {session.finalReport.overallRating}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-700 mt-4 leading-relaxed">
              {session.finalReport.summary}
            </p>
          </div>

          {/* 4 Core Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Accuracy */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900">Technical Accuracy</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {session.finalReport.technicalAccuracy.score}%
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRatingBadge(session.finalReport.technicalAccuracy.rating)}`}>
                    {session.finalReport.technicalAccuracy.rating}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {session.finalReport.technicalAccuracy.summary}
              </p>
            </div>

            {/* Depth */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900">Technical Depth</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {session.finalReport.depth.score}%
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRatingBadge(session.finalReport.depth.rating)}`}>
                    {session.finalReport.depth.rating}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {session.finalReport.depth.summary}
              </p>
            </div>

            {/* Communication */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900">Communication</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {session.finalReport.communication.score}%
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRatingBadge(session.finalReport.communication.rating)}`}>
                    {session.finalReport.communication.rating}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {session.finalReport.communication.summary}
              </p>
            </div>

            {/* Project Understanding */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-900">Project Understanding</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {session.finalReport.projectUnderstanding.score}%
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRatingBadge(session.finalReport.projectUnderstanding.rating)}`}>
                    {session.finalReport.projectUnderstanding.rating}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {session.finalReport.projectUnderstanding.summary}
              </p>
            </div>
          </div>

          {/* Strengths & Areas to Improve Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-3">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Demonstrated Strengths</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
                {session.finalReport.strengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800 mb-3">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>Areas to Improve</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
                {session.finalReport.areasToImprove.map((ati, i) => (
                  <li key={i}>{ati}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Next Best Prep Steps */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Recommended Next Actions</h4>
            <div className="space-y-2">
              {session.finalReport.actionableRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <span className="font-mono font-bold text-blue-600">{i + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question-by-Question Transcript */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Complete Session Transcript</h4>
            <div className="space-y-3">
              {session.exchanges.map((ex) => {
                const isExpanded = expandedExchangeId === ex.id;
                return (
                  <div key={ex.id} className="border border-slate-200 rounded p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedExchangeId(isExpanded ? null : ex.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          Step {ex.step}:
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-lg">
                          {ex.question.question}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-blue-600 font-bold">
                          {ex.evaluation.technicalAccuracy}% Acc
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-xs">
                        <div>
                          <strong className="text-slate-700 block mb-0.5">Candidate Answer:</strong>
                          <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-200 font-sans">
                            "{ex.answer}"
                          </p>
                        </div>
                        <div>
                          <strong className="text-slate-700 block mb-0.5">Interviewer Reasoning:</strong>
                          <p className="text-slate-700">{ex.evaluation.conciseFeedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onStartNewInterview({ customCount: 5 })}
              className="px-4 py-2 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Start Another Simulation
            </button>
          </div>
        </div>
      )}

      {/* INTERVIEW HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-slate-300 max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Interview History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No past interview simulation sessions recorded yet.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 border border-slate-200 rounded hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{item.jobTitle}</div>
                      <div className="text-slate-500">
                        {item.company} • {item.completedQuestionsCount} of {item.totalQuestionsCount} questions
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.overallScore !== null && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Score</span>
                          <span className="font-mono font-bold text-sm text-blue-600">
                            {item.overallScore}%
                          </span>
                        </div>
                      )}

                      {onSelectHistoricalSession && (
                        <button
                          type="button"
                          onClick={async () => {
                            setShowHistoryModal(false);
                            await onSelectHistoricalSession(item.id);
                          }}
                          className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-medium"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
