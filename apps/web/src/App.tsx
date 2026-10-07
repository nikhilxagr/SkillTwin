import React, { useState, useEffect } from "react";
import { Shell } from "./components/layout/Shell.js";
import { LandingPage } from "./components/landing/LandingPage.js";
import { DashboardView } from "./components/dashboard/DashboardView.js";
import { ResumeUploadView } from "./components/resume/ResumeUploadView.js";
import { ResumeStructuredView } from "./components/resume/ResumeStructuredView.js";
import { SkillMatrixView } from "./components/matrix/SkillMatrixView.js";
import { JobUploadView } from "./components/job/JobUploadView.js";
import { JobAnalysisView } from "./components/job/JobAnalysisView.js";
import { GapAnalysisView } from "./components/gap/GapAnalysisView.js";
import { ResumeOptimizerView } from "./components/optimizer/ResumeOptimizerView.js";
import { JobSpecificResumeView } from "./components/tailoring/JobSpecificResumeView.js";
import { InterviewSimulatorView } from "./components/simulator/InterviewSimulatorView.js";
import { ProjectRecommendationsView } from "./components/projects/ProjectRecommendationsView.js";
import { EvidencePageView } from "./components/evidence/EvidencePageView.js";
import { LatexStudioView } from "./components/latex/LatexStudioView.js";
import { SignupView } from "./components/auth/SignupView.js";
import { LoginView } from "./components/auth/LoginView.js";
import { VerifyEmailView } from "./components/auth/VerifyEmailView.js";
import { ForgotPasswordView } from "./components/auth/ForgotPasswordView.js";
import { ResetPasswordView } from "./components/auth/ResetPasswordView.js";
import { ProfileView } from "./components/profile/ProfileView.js";
import {
  uploadResumeFile,
  uploadResumeText,
  uploadJobFile,
  uploadJobText,
  getLatestResume,
  getResumeMatrix,
  getLatestJob,
  getLatestGapReport,
  compareGap,
  optimizeResume,
  tailorResume,
  evaluateReadiness,
  startInterviewSession,
  submitInterviewAnswer,
  getInterviewSession,
  getInterviewHistory,
  getProjectRecommendations,
  generateProjectBlueprint as apiGenerateProjectBlueprint,
  connectGithub,
  compareGithubEvidence as apiCompareGithubEvidence,
  getLatestGithubReport,
  getGithubRepositories,
  getGithubStatus,
  getCurrentUser,
  logoutUser,
  ApiError,
} from "./api/client.js";
import type { ActiveScreen } from "./types/navigation.js";
import {
  computeCareerReadiness,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateFinalInterviewReport,
  generateProjectRecommendations as localGenerateProjectRecommendations,
  generateProjectBlueprint as localGenerateProjectBlueprint,
  compareGithubEvidence as localCompareGithubEvidence,
  type ResumeExtraction,
  type SkillMatrix,
  type JobExtraction,
  type JobAnalysis,
  type GapAnalysisReport,
  type ResumeOptimizationReport,
  type JobSpecificTailoredResume,
  type CareerReadinessReport,
  type InterviewSessionState,
  type InterviewHistoryItem,
  type SimulatorExchange,
  type ProjectRecommendationReport,
  type ProjectBlueprint,
  type GithubEvidenceReport,
  type AnalyzedRepository,
  type SafeUser,
} from "@skilltwin/contracts";

const parseHash = (hash: string): ActiveScreen => {
  const clean = hash.replace(/^#\/?/, "").split("?")[0].toLowerCase().trim();
  switch (clean) {
    case "login":
      return "login";
    case "signup":
    case "register":
      return "signup";
    case "verify-email":
    case "verify_email":
    case "verify":
      return "verify_email";
    case "forgot-password":
    case "forgot_password":
      return "forgot_password";
    case "reset-password":
    case "reset_password":
      return "reset_password";
    case "profile":
      return "profile";
    case "settings":
      return "settings";
    case "dashboard":
      return "dashboard";
    case "resume":
    case "resume-upload":
      return "resume_upload";
    case "resume-view":
      return "resume_view";
    case "skills":
    case "skill-matrix":
      return "skill_matrix";
    case "job":
    case "job-analysis":
    case "jd-analysis":
      return "jd_analysis";
    case "job-upload":
    case "jd-upload":
      return "jd_upload";
    case "gap-analysis":
    case "gaps":
      return "gap_analysis";
    case "recommendations":
    case "resume-improvement":
      return "resume_improvement";
    case "tailored":
    case "tailored-resume":
    case "tailoring":
      return "tailored_resume";
    case "interview":
    case "interview-simulator":
    case "interview_simulator":
    case "simulator":
      return "interview_simulator";
    case "projects":
    case "project-recommendations":
    case "project_recommendations":
    case "recommended-projects":
      return "project_recommendations";
    case "evidence":
    case "evidence-page":
    case "github-evidence":
    case "github":
      return "evidence";
    case "latex":
    case "latex-studio":
    case "latex_studio":
      return "latex_studio";
    case "landing":
    case "home":
    case "":
      return "landing";
    default:
      return "landing";
  }
};

const screenToHash = (screen: ActiveScreen): string => {
  switch (screen) {
    case "landing":
      return "#/";
    case "login":
      return "#/login";
    case "signup":
      return "#/signup";
    case "verify_email":
      return "#/verify-email";
    case "forgot_password":
      return "#/forgot-password";
    case "reset_password":
      return "#/reset-password";
    case "profile":
      return "#/profile";
    case "settings":
      return "#/settings";
    case "dashboard":
      return "#/dashboard";
    case "resume":
    case "resume_upload":
      return "#/resume";
    case "resume_view":
      return "#/resume-view";
    case "skills":
    case "skill_matrix":
      return "#/skills";
    case "job_analysis":
    case "jd_analysis":
      return "#/job-analysis";
    case "jd_upload":
      return "#/job-upload";
    case "gap_analysis":
      return "#/gap-analysis";
    case "recommendations":
    case "resume_improvement":
      return "#/recommendations";
    case "tailored_resume":
      return "#/tailored-resume";
    case "interview_simulator":
      return "#/interview-simulator";
    case "project_recommendations":
      return "#/projects";
    case "evidence":
      return "#/evidence";
    case "latex_studio":
      return "#/latex-studio";
  }
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>("landing");
  const [resume, setResume] = useState<ResumeExtraction | null>(null);
  const [matrix, setMatrix] = useState<SkillMatrix | null>(null);
  const [job, setJob] = useState<JobExtraction | null>(null);
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [gapReport, setGapReport] = useState<GapAnalysisReport | null>(null);
  const [optimization, setOptimization] = useState<ResumeOptimizationReport | null>(null);
  const [tailoredResume, setTailoredResume] = useState<JobSpecificTailoredResume | null>(null);
  const [readinessReport, setReadinessReport] = useState<CareerReadinessReport | null>(null);
  const [interviewSession, setInterviewSession] = useState<InterviewSessionState | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewHistoryItem[]>([]);
  const [projectRecommendations, setProjectRecommendations] = useState<ProjectRecommendationReport | null>(null);
  const [activeBlueprint, setActiveBlueprint] = useState<ProjectBlueprint | null>(null);
  const [githubReport, setGithubReport] = useState<GithubEvidenceReport | null>(null);
  const [analyzedRepositories, setAnalyzedRepositories] = useState<AnalyzedRepository[]>([]);
  const [githubUsername, setGithubUsername] = useState<string>("");
  const [githubToken, setGithubToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadUserData = async () => {
    try {
      const latestResume = await getLatestResume();
      if (latestResume) {
        setResume(latestResume);
        const matrixData = await getResumeMatrix(latestResume.id);
        if (matrixData) setMatrix(matrixData);
      }
      const latestJobData = await getLatestJob();
      if (latestJobData) {
        setJob(latestJobData.job);
        setJobAnalysis(latestJobData.analysis);
      }
      try {
        const latestGap = await getLatestGapReport();
        if (latestGap) setGapReport(latestGap);
      } catch {
        // no gap report yet
      }
    } catch {
      // quiet fallback
    }
  };

  // Load authenticated session on startup
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          loadUserData();
        }
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  const isPublicScreen = (screen: ActiveScreen): boolean => {
    return [
      "landing",
      "login",
      "signup",
      "verify_email",
      "forgot_password",
      "reset_password",
    ].includes(screen);
  };

  // Route protection
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser && !isPublicScreen(currentScreen)) {
      setCurrentScreen("login");
      if (typeof window !== "undefined") {
        try {
          window.location.hash = "#/login";
        } catch {
          // Ignore
        }
      }
    } else if (currentUser && (currentScreen === "login" || currentScreen === "signup")) {
      setCurrentScreen("dashboard");
      if (typeof window !== "undefined") {
        try {
          window.location.hash = "#/dashboard";
        } catch {
          // Ignore
        }
      }
    }
  }, [currentUser, currentScreen, authLoading]);

  // Hash-based client routing synchronization
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== "undefined") {
        const route = parseHash(window.location.hash);
        setCurrentScreen(route);

        if (window.location.hash.includes("oauth=") || window.location.hash.includes("oauth_success")) {
          getCurrentUser().then((user) => {
            if (user) {
              setCurrentUser(user);
              loadUserData();
            }
          });
        }
      }
    };

    if (typeof window !== "undefined" && window.location.hash) {
      const initial = parseHash(window.location.hash);
      if (initial !== "landing") {
        setCurrentScreen(initial);
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  const handleNavigate = (screen: ActiveScreen) => {
    const resolved: ActiveScreen =
      screen === "resume"
        ? "resume_upload"
        : screen === "skills"
        ? "skill_matrix"
        : screen === "job_analysis"
        ? "jd_analysis"
        : screen === "recommendations"
        ? "resume_improvement"
        : screen;

    if (resolved === "gap_analysis" && matrix && job && !gapReport) {
      handleRunGapAnalysis();
      return;
    }
    if (resolved === "resume_improvement" && (resume || matrix) && (job || gapReport) && !optimization) {
      handleRunResumeOptimization();
      return;
    }
    if (resolved === "tailored_resume" && (resume || matrix) && (job || gapReport) && !tailoredResume) {
      handleRunJobTailoring();
      return;
    }
    setCurrentScreen(resolved);

    if (typeof window !== "undefined") {
      const targetHash = screenToHash(resolved);
      if (window.location.hash !== targetHash) {
        try {
          window.location.hash = targetHash;
        } catch {
          // Ignore in environments where window.location.hash cannot be set
        }
      }
      try {
        if (typeof window.scrollTo === "function") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch {
        // Ignore in test environments without full scroll behavior support
      }
    }
  };

  const handleReset = () => {
    setResume(null);
    setMatrix(null);
    setJob(null);
    setJobAnalysis(null);
    setGapReport(null);
    setOptimization(null);
    setTailoredResume(null);
    setReadinessReport(null);
    setInterviewSession(null);
    setInterviewHistory([]);
    setProjectRecommendations(null);
    setActiveBlueprint(null);
    setGithubReport(null);
    setAnalyzedRepositories([]);
    setGithubUsername("");
    setGithubToken("");
    setApiError(null);
    if (!currentUser) {
      setCurrentScreen("landing");
      if (typeof window !== "undefined") {
        try {
          window.location.hash = "#/";
        } catch {
          // Ignore
        }
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    }
    setCurrentUser(null);
    handleReset();
    handleNavigate("login");
  };

  const handleUploadResumeFile = async (file: File) => {
    setLoading(true);
    setApiError(null);

    try {
      const result = await uploadResumeFile(file);
      setResume(result.resume);
      setMatrix(result.matrix);
      setLoading(false);
      setCurrentScreen("resume_upload");
    } catch (err: any) {
      setApiError(err.message || "Failed to process resume file. Please ensure it is a valid PDF or text document.");
      setLoading(false);
    }
  };

  const handleUploadResumeText = async (fileName: string, text: string) => {
    setLoading(true);
    setApiError(null);

    try {
      const result = await uploadResumeText(fileName, text);
      setResume(result.resume);
      setMatrix(result.matrix);
      setLoading(false);
      setCurrentScreen("resume_upload");
    } catch (err: any) {
      setApiError(err.message || "Failed to analyze resume text. Please ensure backend is running.");
      setLoading(false);
    }
  };

  const handleUploadJobFile = async (file: File, title?: string, company?: string) => {
    setLoading(true);
    setApiError(null);

    try {
      const result = await uploadJobFile(file, title, company);
      setJob(result.job);
      setJobAnalysis(result.analysis);
      setLoading(false);
      setCurrentScreen("jd_analysis");
    } catch (err: any) {
      setApiError(err.message || "Failed to process job description file. Please ensure it is a valid PDF or text document.");
      setLoading(false);
    }
  };

  const handleUploadJobText = async (title: string, company: string, text: string) => {
    setLoading(true);
    setApiError(null);

    try {
      const result = await uploadJobText(title, company, text);
      setJob(result.job);
      setJobAnalysis(result.analysis);
      setLoading(false);
      setCurrentScreen("jd_analysis");
    } catch (err: any) {
      setApiError(err.message || "Failed to analyze job description text. Please ensure backend is running.");
      setLoading(false);
    }
  };

  const handleRunGapAnalysis = async () => {
    if (!matrix || !job) {
      setApiError("Please ensure both your resume and a target job description are ingested before running gap analysis.");
      setCurrentScreen(matrix ? "jd_upload" : "resume_upload");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const report = await compareGap(matrix, job, matrix.resumeId, job.id);
      setGapReport(report);
      setLoading(false);
      setCurrentScreen("gap_analysis");
    } catch (err: any) {
      setApiError(err.message || "Failed to execute gap comparison.");
      setLoading(false);
    }
  };

  const handleRunResumeOptimization = async () => {
    if (!resume || !matrix || !job) {
      setApiError("Please ensure both your resume and target job description are ingested before optimizing.");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const report = await optimizeResume(
        resume,
        matrix,
        job,
        gapReport || undefined,
        resume.id,
        job.id
      );
      setOptimization(report);
      setLoading(false);
      setCurrentScreen("resume_improvement");
    } catch (err: any) {
      setApiError(err.message || "Resume optimization failed.");
      setLoading(false);
    }
  };

  const handleRunJobTailoring = async () => {
    if (!resume || !matrix || !job) {
      setApiError("Please ensure both your resume and target job description are ingested before tailoring.");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const result = await tailorResume(
        resume,
        matrix,
        job,
        gapReport || undefined,
        resume.id,
        job.id
      );
      setTailoredResume(result);
      setLoading(false);
      setCurrentScreen("tailored_resume");
    } catch (err: any) {
      setApiError(err.message || "Resume tailoring failed.");
      setLoading(false);
    }
  };

  const handleEvaluateReadiness = async () => {
    if (!matrix || !resume || !job) {
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const rep = await evaluateReadiness(matrix, resume, job, gapReport || undefined);
      setReadinessReport(rep);
      setLoading(false);
    } catch (err: any) {
      console.warn("Live readiness evaluation failed, calculating locally:", err);
      const rep = computeCareerReadiness({
        matrix,
        resume,
        job,
        gapReport,
      });
      setReadinessReport(rep);
      setLoading(false);
    }
  };

  const handleStartNewInterview = async (options?: { customCount?: number }) => {
    if (!resume || !job || !matrix) {
      setApiError("Please upload your resume and a target job before launching an interview session.");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const newSession = await startInterviewSession({
        resumeId: resume.id,
        jobId: job.id,
        customQuestionsCount: options?.customCount || 5,
      });
      setInterviewSession(newSession);
      try {
        const hist = await getInterviewHistory();
        setInterviewHistory(hist);
      } catch {
        // preserve local history
      }
      setCurrentScreen("interview_simulator");
      if (typeof window !== "undefined") {
        window.location.hash = "#/interview-simulator";
      }
      setLoading(false);
    } catch (err: any) {
      console.warn("Live interview start failed, falling back to local deterministic generation:", err);
      const questions = generateInterviewQuestions({
        resume,
        matrix,
        job,
        gapReport: (gapReport || undefined) as any,
        customCount: options?.customCount || 5,
      });

      const fallbackSession: InterviewSessionState = {
        id: `sim-${Date.now()}`,
        resumeId: resume.id,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company || "Target Company",
        status: "in_progress",
        currentStepIndex: 0,
        totalSteps: questions.length,
        currentQuestion: questions[0] || null,
        plannedQuestions: questions,
        exchanges: [],
        finalReport: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setInterviewSession(fallbackSession);
      setCurrentScreen("interview_simulator");
      if (typeof window !== "undefined") {
        window.location.hash = "#/interview-simulator";
      }
      setLoading(false);
    }
  };

  const handleSubmitInterviewAnswer = async (params: {
    sessionId: string;
    questionId: string;
    answer: string;
  }) => {
    setLoading(true);
    setApiError(null);

    try {
      const result = await submitInterviewAnswer(params);
      setInterviewSession(result.session);
      try {
        const hist = await getInterviewHistory();
        setInterviewHistory(hist);
      } catch {
        // preserve local
      }
      setLoading(false);
    } catch (err: any) {
      console.warn("Live answer evaluation failed, falling back to local evaluation:", err);
      if (interviewSession && interviewSession.currentQuestion && resume && matrix && job) {
        const q = interviewSession.currentQuestion;
        const evaluation = evaluateInterviewAnswer({
          question: q,
          answer: params.answer,
          previousExchanges: interviewSession.exchanges,
          resume,
          matrix,
          job,
          gapReport: gapReport || undefined,
        });

        const exchange: SimulatorExchange = {
          id: `ex-${Date.now()}`,
          step: interviewSession.exchanges.length + 1,
          question: q,
          answer: params.answer.trim(),
          evaluation,
          timestamp: new Date().toISOString(),
        };

        const updatedExchanges = [...interviewSession.exchanges, exchange];
        const nextIndex = interviewSession.currentStepIndex + 1;
        const isNowCompleted = nextIndex >= interviewSession.plannedQuestions.length;

        const updatedSession: InterviewSessionState = {
          ...interviewSession,
          currentStepIndex: nextIndex,
          currentQuestion: isNowCompleted ? null : interviewSession.plannedQuestions[nextIndex],
          status: isNowCompleted ? "completed" : "in_progress",
          exchanges: updatedExchanges,
          finalReport: isNowCompleted
            ? generateFinalInterviewReport({
                sessionId: interviewSession.id,
                jobTitle: interviewSession.jobTitle,
                company: interviewSession.company,
                exchanges: updatedExchanges,
              })
            : null,
          updatedAt: new Date().toISOString(),
        };

        setInterviewSession(updatedSession);

        if (isNowCompleted && updatedSession.finalReport) {
          const newHistItem: InterviewHistoryItem = {
            id: updatedSession.id,
            jobTitle: updatedSession.jobTitle,
            company: updatedSession.company,
            status: "completed",
            overallScore: updatedSession.finalReport.overallScore,
            completedQuestionsCount: updatedExchanges.length,
            totalQuestionsCount: updatedSession.totalSteps,
            createdAt: updatedSession.createdAt,
            completedAt: updatedSession.finalReport.completedAt,
          };
          setInterviewHistory((prev) => [newHistItem, ...prev]);
        }
      }
      setLoading(false);
    }
  };

  const handleSelectHistoricalSession = async (sessionId: string) => {
    try {
      const fetched = await getInterviewSession(sessionId);
      setInterviewSession(fetched);
    } catch (err) {
      console.warn("Could not fetch interview session:", err);
    }
    setCurrentScreen("interview_simulator");
  };

  const handleGenerateBlueprint = async (projectId: string): Promise<ProjectBlueprint | null> => {
    try {
      const result = await apiGenerateProjectBlueprint(projectId);
      setActiveBlueprint(result);
      return result;
    } catch (err) {
      console.warn("API blueprint generation failed, falling back to local blueprint generator:", err);
      const proj = projectRecommendations?.projects.find((p) => p.id === projectId);
      if (proj) {
        const localBp = localGenerateProjectBlueprint(proj);
        setActiveBlueprint(localBp);
        return localBp;
      }
      return null;
    }
  };

  const handleRefreshProjectRecommendations = async () => {
    if (!job || !matrix) {
      setApiError("Please upload a resume and target job description before generating recommendations.");
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const result = await getProjectRecommendations({
        job,
        matrix,
        gapReport: gapReport || undefined,
      });
      setProjectRecommendations(result);
      setLoading(false);
    } catch (err: any) {
      console.warn("API project recommendations failed, falling back to local engine:", err);
      const fallback = localGenerateProjectRecommendations({
        job,
        matrix,
        gapReport: gapReport || undefined,
      });
      setProjectRecommendations(fallback);
      setLoading(false);
    }
  };

  const handleConnectGithub = async (username: string, token?: string) => {
    if (!username || !username.trim()) {
      setApiError("Please specify a valid GitHub username.");
      return;
    }
    setLoading(true);
    setApiError(null);
    setGithubUsername(username);
    if (token !== undefined) {
      setGithubToken(token);
    }

    try {
      const report = await connectGithub({
        username,
        token: token || undefined,
        resume: resume || undefined,
        matrix: matrix || undefined,
      });
      setGithubReport(report);
      setAnalyzedRepositories(report.analyzedRepositories);
    } catch (err: any) {
      setApiError(err.message || "Failed to analyze GitHub repositories.");
    } finally {
      setLoading(false);
    }
  };

  // Standalone auth loading fallback
  if (authLoading && !isPublicScreen(currentScreen)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Standalone public & auth views
  if (currentScreen === "landing") {
    return (
      <LandingPage
        onEnterApp={() => handleNavigate(currentUser ? "dashboard" : "login")}
      />
    );
  }

  if (currentScreen === "login") {
    return (
      <LoginView
        onNavigate={(screen) => handleNavigate(screen as ActiveScreen)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadUserData();
          handleNavigate("dashboard");
        }}
      />
    );
  }

  if (currentScreen === "signup") {
    return (
      <SignupView
        onNavigate={(screen) => handleNavigate(screen as ActiveScreen)}
        onSignupSuccess={(user) => {
          setCurrentUser(user);
          loadUserData();
          handleNavigate("dashboard");
        }}
      />
    );
  }

  if (currentScreen === "verify_email") {
    return (
      <VerifyEmailView
        onNavigate={(screen) => handleNavigate(screen as ActiveScreen)}
      />
    );
  }

  if (currentScreen === "forgot_password") {
    return (
      <ForgotPasswordView
        onNavigate={(screen) => handleNavigate(screen as ActiveScreen)}
      />
    );
  }

  if (currentScreen === "reset_password") {
    return (
      <ResetPasswordView
        onNavigate={(screen) => handleNavigate(screen as ActiveScreen)}
      />
    );
  }

  // Shell for all authenticated application screens
  return (
    <Shell
      currentScreen={currentScreen}
      onNavigate={handleNavigate}
      activeRole={job?.title || currentUser?.profile?.targetRole || "Target Role Not Set"}
      hasResume={!!resume}
      hasJob={!!job}
      onReset={handleReset}
      skillCount={matrix?.items.length || 0}
      criticalGapCount={gapReport?.summary.criticalGapCount || 0}
      candidateName={currentUser?.name || resume?.profile.name || "Developer Twin"}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {currentScreen === "dashboard" && (
        <DashboardView
          currentUser={currentUser}
          resume={resume}
          matrix={matrix}
          job={job}
          gapReport={gapReport}
          readinessReport={readinessReport}
          onNavigate={handleNavigate}
          onRefreshReadiness={handleEvaluateReadiness}
        />
      )}

      {currentScreen === "resume_upload" && (
        <ResumeUploadView
          currentResume={resume}
          onUploadFile={handleUploadResumeFile}
          onUploadText={handleUploadResumeText}
          onNavigate={handleNavigate}
          loading={loading}
          errorMessage={apiError}
          onClearError={() => setApiError(null)}
        />
      )}

      {currentScreen === "resume_view" && (
        <ResumeStructuredView resume={resume} onNavigate={handleNavigate} />
      )}

      {currentScreen === "skill_matrix" && (
        <SkillMatrixView
          matrix={matrix}
          onNavigate={handleNavigate}
        />
      )}

      {currentScreen === "jd_upload" && (
        <JobUploadView
          currentJob={job}
          onUploadFile={handleUploadJobFile}
          onUploadJob={handleUploadJobText}
          onNavigate={handleNavigate}
          loading={loading}
          errorMessage={apiError}
          onClearError={() => setApiError(null)}
          onRunGapAnalysis={handleRunGapAnalysis}
        />
      )}

      {currentScreen === "jd_analysis" && (
        <JobAnalysisView
          job={job}
          jobAnalysis={jobAnalysis}
          onNavigate={handleNavigate}
          onRunGapAnalysis={handleRunGapAnalysis}
        />
      )}

      {currentScreen === "gap_analysis" && (
        <GapAnalysisView
          report={gapReport}
          onNavigate={handleNavigate}
          onRecomputeGap={handleRunGapAnalysis}
          onRunOptimization={handleRunResumeOptimization}
          loading={loading}
        />
      )}

      {currentScreen === "resume_improvement" && (
        <ResumeOptimizerView
          optimization={optimization}
          resume={resume}
          onNavigate={handleNavigate}
          onRecomputeOptimization={handleRunResumeOptimization}
        />
      )}

      {currentScreen === "tailored_resume" && (
        <JobSpecificResumeView
          tailoredResume={tailoredResume}
          masterResume={resume}
          selectedJob={job}
          onNavigate={handleNavigate}
          onRecomputeTailoring={handleRunJobTailoring}
        />
      )}

      {currentScreen === "interview_simulator" && (
        <InterviewSimulatorView
          session={interviewSession}
          history={interviewHistory}
          resume={resume}
          job={job}
          matrix={matrix}
          gapReport={gapReport}
          onStartNewInterview={handleStartNewInterview}
          onSubmitAnswer={handleSubmitInterviewAnswer}
          onSelectHistoricalSession={handleSelectHistoricalSession}
          onNavigate={handleNavigate}
          isLoading={loading}
        />
      )}

      {currentScreen === "project_recommendations" && (
        <ProjectRecommendationsView
          report={projectRecommendations}
          blueprint={activeBlueprint}
          job={job}
          matrix={matrix}
          gapReport={gapReport}
          onGenerateBlueprint={handleGenerateBlueprint}
          onRefreshRecommendations={handleRefreshProjectRecommendations}
          onNavigate={handleNavigate}
          isLoading={loading}
        />
      )}

      {currentScreen === "evidence" && (
        <EvidencePageView
          report={githubReport}
          repositories={analyzedRepositories}
          resume={resume}
          matrix={matrix}
          username={githubUsername}
          token={githubToken}
          onConnect={handleConnectGithub}
          onNavigate={handleNavigate}
          isLoading={loading}
        />
      )}

      {currentScreen === "latex_studio" && (
        <LatexStudioView
          resume={resume}
          tailoredResume={tailoredResume}
          initialTexSource={""}
          onNavigate={(screen) => handleNavigate(screen as ActiveScreen)}
        />
      )}

      {(currentScreen === "profile" || currentScreen === "settings") && (
        <ProfileView
          currentUser={currentUser}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          onNavigate={(screen) => handleNavigate(screen as ActiveScreen)}
        />
      )}
    </Shell>
  );
};

