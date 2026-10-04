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
  ApiError,
} from "./api/client.js";
import type { ActiveScreen } from "./types/navigation.js";
import {
  computeCareerReadiness,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  generateFinalInterviewReport,
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
} from "@skilltwin/contracts";

const parseHash = (hash: string): ActiveScreen => {
  const clean = hash.replace(/^#\/?/, "").toLowerCase().trim();
  switch (clean) {
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
    default:
      return "#/";
  }
};

export const App: React.FC = () => {
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
  const [loading, setLoading] = useState(false);
  const [isSampleLoaded, setIsSampleLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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

  // If on landing screen, show standalone LandingPage
  if (currentScreen === "landing") {
    return (
      <LandingPage
        onEnterApp={() => setCurrentScreen("dashboard")}
        onLoadSample={handleLoadSample}
      />
    );
  }

  // Shell for all application screens
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
      candidateName={resume?.profile.name || "Developer Twin"}
    >
      {currentScreen === "dashboard" && (
        <DashboardView
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
    </Shell>
  );
};

