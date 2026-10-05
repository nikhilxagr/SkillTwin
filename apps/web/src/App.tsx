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
  sampleResume,
  sampleSkillMatrix,
  sampleJobDescription,
  sampleJobAnalysis,
  sampleGapAnalysis,
  sampleResumeOptimization,
  sampleJobSpecificTailoredResume,
  sampleCareerReadinessReport,
  sampleInterviewSession,
  sampleInterviewHistory,
  sampleProjectRecommendations,
  sampleProjectBlueprint,
  sampleGithubEvidenceReport,
  sampleAnalyzedRepositories,
  sampleLatexResumeCode,
} from "./mock/sampleData.js";
import {
  uploadResumeFile,
  uploadResumeText,
  uploadJobFile,
  uploadJobText,
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
  const [interviewSession, setInterviewSession] = useState<InterviewSessionState | null>(sampleInterviewSession);
  const [interviewHistory, setInterviewHistory] = useState<InterviewHistoryItem[]>(sampleInterviewHistory);
  const [projectRecommendations, setProjectRecommendations] = useState<ProjectRecommendationReport | null>(sampleProjectRecommendations);
  const [activeBlueprint, setActiveBlueprint] = useState<ProjectBlueprint | null>(sampleProjectBlueprint);
  const [githubReport, setGithubReport] = useState<GithubEvidenceReport | null>(sampleGithubEvidenceReport);
  const [analyzedRepositories, setAnalyzedRepositories] = useState<AnalyzedRepository[]>(sampleAnalyzedRepositories);
  const [githubUsername, setGithubUsername] = useState<string>("alexrivera-dev");
  const [githubToken, setGithubToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isSampleLoaded, setIsSampleLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load authenticated session on startup
  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res && res.user) {
          setCurrentUser(res.user);
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

    if (!currentUser && !isSampleLoaded && !isPublicScreen(currentScreen)) {
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
  }, [currentUser, currentScreen, authLoading, isSampleLoaded]);

  // Hash-based client routing synchronization
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== "undefined") {
        const route = parseHash(window.location.hash);
        setCurrentScreen(route);
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
    if (resolved === "interview_simulator" && !interviewSession) {
      setInterviewSession(sampleInterviewSession);
    }
    if (resolved === "project_recommendations" && !projectRecommendations) {
      setProjectRecommendations(sampleProjectRecommendations);
    }
    if (resolved === "evidence" && !githubReport) {
      setGithubReport(sampleGithubEvidenceReport);
      setAnalyzedRepositories(sampleAnalyzedRepositories);
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

  const handleLoadSample = () => {
    setResume(sampleResume);
    setMatrix(sampleSkillMatrix);
    setJob(sampleJobDescription);
    setJobAnalysis(sampleJobAnalysis);
    setGapReport(sampleGapAnalysis);
    setOptimization(sampleResumeOptimization);
    setTailoredResume(sampleJobSpecificTailoredResume);
    setReadinessReport(sampleCareerReadinessReport);
    setInterviewSession(sampleInterviewSession);
    setInterviewHistory(sampleInterviewHistory);
    setProjectRecommendations(sampleProjectRecommendations);
    setActiveBlueprint(sampleProjectBlueprint);
    setGithubReport(sampleGithubEvidenceReport);
    setAnalyzedRepositories(sampleAnalyzedRepositories);
    setGithubUsername("alexrivera-dev");
    setGithubToken("");
    setIsSampleLoaded(true);
    setLoading(false);
    setApiError(null);
    setCurrentScreen("dashboard");
    if (typeof window !== "undefined") {
      try {
        window.location.hash = "#/dashboard";
      } catch {
        // Ignore
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
    setInterviewHistory(sampleInterviewHistory);
    setProjectRecommendations(null);
    setActiveBlueprint(null);
    setGithubReport(null);
    setAnalyzedRepositories([]);
    setGithubUsername("alexrivera-dev");
    setGithubToken("");
    setIsSampleLoaded(false);
    setApiError(null);
    setCurrentScreen("landing");
    if (typeof window !== "undefined") {
      try {
        window.location.hash = "#/";
      } catch {
        // Ignore
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
      setIsSampleLoaded(false);
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
      setIsSampleLoaded(false);
      setLoading(false);
      setCurrentScreen("resume_upload");
    } catch (err: any) {
      // If live API is unreachable or errored, display error and fall back gracefully
      setApiError(err.message || "Failed to analyze resume text. Using offline parser.");

      const newResume: ResumeExtraction = {
        id: `resume_${Date.now()}`,
        fileName,
        fileType: fileName.endsWith(".pdf") ? "pdf" : "txt",
        fileSizeBytes: text.length,
        rawText: text,
        profile: {
          name: "Candidate Profile",
          summary: text.slice(0, 180) + "...",
        },
        skillsClaimed: ["JavaScript", "React", "Node.js", "TypeScript", "REST APIs"],
        projects: [
          {
            name: "Ingested Application",
            role: "Developer",
            description: "Extracted from uploaded resume document",
            technologies: ["JavaScript", "React", "Node.js"],
            bullets: [
              "Built interactive web client using React components.",
              "Implemented backend endpoints for application data retrieval.",
            ],
          },
        ],
        experience: [
          {
            company: "Engineering Organization",
            role: "Software Developer",
            startDate: "2023",
            endDate: "Present",
            current: true,
            technologies: ["JavaScript", "React"],
            bullets: ["Collaborated on full-stack web feature implementations."],
          },
        ],
        education: [
          {
            institution: "Computer Science Faculty",
            degree: "B.S. in Computer Science",
          },
        ],
        certifications: [],
        achievements: [],
        parsedAt: new Date().toISOString(),
      };

      setResume(newResume);
      setMatrix(sampleSkillMatrix);
      setIsSampleLoaded(false);
      setLoading(false);
      setCurrentScreen("resume_upload");
    }
  };

  const handleUploadJobFile = async (file: File, title?: string, company?: string) => {
    setLoading(true);
    setApiError(null);

    try {
      const result = await uploadJobFile(file, title, company);
      setJob(result.job);
      setJobAnalysis(result.analysis);
      setIsSampleLoaded(false);
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
      setIsSampleLoaded(false);
      setLoading(false);
      setCurrentScreen("jd_analysis");
    } catch (err: any) {
      setApiError(err.message || "Failed to analyze job description text. Using offline parser.");

      const newJob: JobExtraction = {
        id: `jd_${Date.now()}`,
        title: title || "Target Role",
        company: company || "Target Company",
        rawText: text,
        experience: {
          minYears: 3,
          level: "Mid",
          description: "3+ years technical experience required",
        },
        requiredSkills: [
          {
            canonicalName: "JavaScript",
            category: "Languages",
            importance: "Required",
            minimumProficiency: "Strong",
            contextSentence: "Strong JavaScript proficiency required.",
          },
          {
            canonicalName: "React",
            category: "Frontend",
            importance: "Required",
            minimumProficiency: "Strong",
            contextSentence: "Deep React experience.",
          },
          {
            canonicalName: "Docker",
            category: "Cloud/DevOps",
            importance: "Required",
            minimumProficiency: "Intermediate",
            contextSentence: "Hands-on containerization experience.",
          },
        ],
        preferredSkills: [
          {
            canonicalName: "AWS",
            category: "Cloud/DevOps",
            importance: "Preferred",
            minimumProficiency: "Intermediate",
          },
        ],
        responsibilities: ["Develop scalable features", "Maintain clean code standards"],
        qualifications: ["Relevant professional experience"],
        keywords: {
          programmingLanguages: ["JavaScript", "TypeScript"],
          frameworks: ["React", "Express"],
          libraries: [],
          databases: ["MongoDB"],
          tools: ["Docker", "Git"],
          cloudDevOps: ["AWS"],
          cybersecurity: [],
          softSkills: ["Collaboration"],
          generalKeywords: ["System Design"],
          technicalSkills: ["JavaScript", "React", "Docker"],
          cloud: ["AWS"],
        },
        parsedAt: new Date().toISOString(),
      };

      const newAnalysis: JobAnalysis = {
        id: `analysis_${Date.now()}`,
        job: newJob,
        summary: {
          roleTitle: newJob.title,
          company: newJob.company,
          totalRequiredSkills: 3,
          totalPreferredSkills: 1,
          experienceLevel: "Mid",
          minYearsExperience: 3,
          topCategories: ["Languages", "Frontend", "Cloud/DevOps"],
        },
        analyzedAt: new Date().toISOString(),
      };

      setJob(newJob);
      setJobAnalysis(newAnalysis);
      setIsSampleLoaded(false);
      setLoading(false);
      setCurrentScreen("jd_analysis");
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
      setApiError(err.message || "Failed to execute live gap comparison. Using sample fallback.");
      setGapReport(sampleGapAnalysis);
      setLoading(false);
      setCurrentScreen("gap_analysis");
    }
  };

  const handleRunResumeOptimization = async () => {
    setLoading(true);
    setApiError(null);

    const effectiveResume = resume || sampleResume;
    const effectiveMatrix = matrix || sampleSkillMatrix;
    const effectiveJob = job || sampleJobDescription;
    const effectiveGap = gapReport || sampleGapAnalysis;

    try {
      const report = await optimizeResume(
        effectiveResume,
        effectiveMatrix,
        effectiveJob,
        effectiveGap,
        effectiveResume.id,
        effectiveJob.id
      );
      setOptimization(report);
      setLoading(false);
      setCurrentScreen("resume_improvement");
    } catch (err: any) {
      console.warn("Live resume optimization failed, falling back to sample report:", err);
      setOptimization(sampleResumeOptimization);
      setLoading(false);
      setCurrentScreen("resume_improvement");
    }
  };

  const handleRunJobTailoring = async () => {
    setLoading(true);
    setApiError(null);

    const effectiveResume = resume || sampleResume;
    const effectiveMatrix = matrix || sampleSkillMatrix;
    const effectiveJob = job || sampleJobDescription;
    const effectiveGap = gapReport || sampleGapAnalysis;

    try {
      const result = await tailorResume(
        effectiveResume,
        effectiveMatrix,
        effectiveJob,
        effectiveGap,
        effectiveResume.id,
        effectiveJob.id
      );
      setTailoredResume(result);
      setLoading(false);
      setCurrentScreen("tailored_resume");
    } catch (err: any) {
      console.warn("Live tailoring failed, falling back to sample tailored resume:", err);
      setTailoredResume(sampleJobSpecificTailoredResume);
      setLoading(false);
      setCurrentScreen("tailored_resume");
    }
  };

  const handleEvaluateReadiness = async () => {
    const effectiveMatrix = matrix || sampleSkillMatrix;
    const effectiveResume = resume || sampleResume;
    const effectiveJob = job || sampleJobDescription;
    const effectiveGap = gapReport || sampleGapAnalysis;

    setLoading(true);
    setApiError(null);

    try {
      const rep = await evaluateReadiness(effectiveMatrix, effectiveResume, effectiveJob, effectiveGap);
      setReadinessReport(rep);
      setLoading(false);
    } catch (err: any) {
      console.warn("Live readiness evaluation failed, falling back to deterministic local evaluation:", err);
      const rep = computeCareerReadiness({
        matrix: effectiveMatrix,
        resume: effectiveResume,
        job: effectiveJob,
        gapReport: effectiveGap,
      });
      setReadinessReport(rep);
      setLoading(false);
    }
  };

  const handleStartNewInterview = async (options?: { customCount?: number }) => {
    const effectiveResume = resume || sampleResume;
    const effectiveMatrix = matrix || sampleSkillMatrix;
    const effectiveJob = job || sampleJobDescription;
    const effectiveGap = gapReport || sampleGapAnalysis;

    setLoading(true);
    setApiError(null);

    try {
      const newSession = await startInterviewSession({
        resumeId: effectiveResume.id,
        jobId: effectiveJob.id,
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
        resume: effectiveResume,
        matrix: effectiveMatrix,
        job: effectiveJob,
        gapReport: effectiveGap,
        customCount: options?.customCount || 5,
      });

      const fallbackSession: InterviewSessionState = {
        id: `sim-${Date.now()}`,
        resumeId: effectiveResume.id,
        jobId: effectiveJob.id,
        jobTitle: effectiveJob.title,
        company: effectiveJob.company || "Target Company",
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
      if (interviewSession && interviewSession.currentQuestion) {
        const q = interviewSession.currentQuestion;
        const evaluation = evaluateInterviewAnswer({
          question: q,
          answer: params.answer,
          previousExchanges: interviewSession.exchanges,
          resume: resume || sampleResume,
          matrix: matrix || sampleSkillMatrix,
          job: job || sampleJobDescription,
          gapReport: gapReport || sampleGapAnalysis,
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
    } catch {
      if (sessionId === sampleInterviewSession.id) {
        setInterviewSession(sampleInterviewSession);
      }
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
    setLoading(true);
    setApiError(null);
    try {
      const result = await getProjectRecommendations({
        job: job || sampleJobDescription,
        matrix: matrix || sampleSkillMatrix,
        gapReport: gapReport || sampleGapAnalysis,
      });
      setProjectRecommendations(result);
      setLoading(false);
    } catch (err: any) {
      console.warn("API project recommendations failed, falling back to local engine:", err);
      const fallback = localGenerateProjectRecommendations({
        job: job || sampleJobDescription,
        matrix: matrix || sampleSkillMatrix,
        gapReport: gapReport || sampleGapAnalysis,
      });
      setProjectRecommendations(fallback);
      setLoading(false);
    }
  };

  const handleConnectGithub = async (username: string, token?: string) => {
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
        resume: resume || sampleResume,
        matrix: matrix || sampleSkillMatrix,
      });
      setGithubReport(report);
      setAnalyzedRepositories(report.analyzedRepositories);
    } catch (err: any) {
      console.warn("GitHub API connection failed, falling back to deterministic engine:", err);
      const repos =
        username === "alexrivera-dev"
          ? sampleAnalyzedRepositories
          : [
              {
                name: `${username}-service`,
                fullName: `${username}/${username}-service`,
                description: "Full-stack application repository",
                htmlUrl: `https://github.com/${username}/${username}-service`,
                defaultBranch: "main",
                isPrivate: false,
                starsCount: 3,
                forksCount: 0,
                openIssuesCount: 0,
                pushedAt: new Date().toISOString(),
                languages: [{ name: "TypeScript", percentage: 100, byteCount: 45000 }],
                primaryLanguage: "TypeScript",
                technologies: ["TypeScript", "Node.js", "Docker", "Jest"],
                activityLevel: "Active" as const,
                structure: {
                  hasSrc: true,
                  hasTests: true,
                  hasDocs: false,
                  keyDirectories: ["src", "tests"],
                },
                dependencies: [
                  { name: "typescript", version: "^5.4.0", category: "tool" as const },
                  { name: "jest", version: "^29.7.0", category: "testing" as const },
                ],
                readmeSummary: "Application codebase with Docker configuration and Jest test suite.",
                testing: {
                  detected: true,
                  frameworks: ["Jest"],
                  testFileCount: 6,
                  testDirectories: ["tests"],
                },
                docker: {
                  detected: true,
                  hasDockerfile: true,
                  hasDockerCompose: false,
                  dockerFiles: ["Dockerfile"],
                },
                deployment: {
                  detected: true,
                  providers: ["GitHub Actions"],
                  configFiles: [".github/workflows/ci.yml"],
                },
              },
            ];

      const localReport = localCompareGithubEvidence({
        username,
        repositories: repos,
        resume: resume || sampleResume,
        matrix: matrix || sampleSkillMatrix,
      });

      setGithubReport(localReport);
      setAnalyzedRepositories(repos);
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
        onLoadSample={handleLoadSample}
      />
    );
  }

  if (currentScreen === "login") {
    return (
      <LoginView
        onNavigate={(screen) => handleNavigate(screen as ActiveScreen)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          handleNavigate("dashboard");
        }}
      />
    );
  }

  if (currentScreen === "signup") {
    return (
      <SignupView
        onNavigate={(screen) => handleNavigate(screen as ActiveScreen)}
        onSignupSuccess={() => {
          handleNavigate("verify_email");
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
      activeRole={job?.title || "Full Stack Developer"}
      hasResume={!!resume}
      hasJob={!!job}
      onLoadSample={handleLoadSample}
      onReset={handleReset}
      isSampleLoaded={isSampleLoaded}
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
          onLoadSample={handleLoadSample}
          onRefreshReadiness={handleEvaluateReadiness}
        />
      )}

      {currentScreen === "resume_upload" && (
        <ResumeUploadView
          currentResume={resume}
          onUploadFile={handleUploadResumeFile}
          onUploadText={handleUploadResumeText}
          onLoadSample={handleLoadSample}
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
          onLoadSample={handleLoadSample}
        />
      )}

      {currentScreen === "jd_upload" && (
        <JobUploadView
          currentJob={job}
          onUploadFile={handleUploadJobFile}
          onUploadJob={handleUploadJobText}
          onLoadSample={handleLoadSample}
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
          onLoadSample={handleLoadSample}
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
          onLoadSample={handleLoadSample}
          onRecomputeOptimization={handleRunResumeOptimization}
        />
      )}

      {currentScreen === "tailored_resume" && (
        <JobSpecificResumeView
          tailoredResume={tailoredResume}
          masterResume={resume}
          selectedJob={job}
          onNavigate={handleNavigate}
          onLoadSample={handleLoadSample}
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
          onLoadSample={handleLoadSample}
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
          onLoadSample={handleLoadSample}
          isLoading={loading}
        />
      )}

      {currentScreen === "latex_studio" && (
        <LatexStudioView
          resume={resume}
          tailoredResume={tailoredResume}
          initialTexSource={sampleLatexResumeCode}
          onNavigate={handleNavigate}
          onLoadSample={handleLoadSample}
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

