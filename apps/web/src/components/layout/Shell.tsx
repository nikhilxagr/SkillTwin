import React, { useState } from "react";
import { Sidebar } from "./Sidebar.js";
import { Header } from "./Header.js";
import { LayoutDashboard, FileText, BarChart2, Briefcase, GitCompare, FileCheck2 } from "lucide-react";
import type { SafeUser } from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface ShellProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  activeRole: string;
  hasResume: boolean;
  hasJob: boolean;
  onReset?: () => void;
  skillCount: number;
  criticalGapCount: number;
  candidateName: string;
  currentUser?: SafeUser | null;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentScreen,
  onNavigate,
  activeRole,
  hasResume,
  hasJob,
  onReset,
  skillCount,
  criticalGapCount,
  candidateName,
  currentUser,
  onLogout,
  children,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isNavActive = (
    target: "dashboard" | "resume" | "skills" | "job_analysis" | "gap_analysis" | "recommendations" | "tailored_resume" | "interview_simulator" | "project_recommendations" | "evidence" | "latex_studio"
  ) => {
    switch (target) {
      case "dashboard":
        return currentScreen === "dashboard";
      case "resume":
        return currentScreen === "resume" || currentScreen === "resume_upload" || currentScreen === "resume_view";
      case "skills":
        return currentScreen === "skills" || currentScreen === "skill_matrix";
      case "job_analysis":
        return currentScreen === "job_analysis" || currentScreen === "jd_analysis" || currentScreen === "jd_upload";
      case "gap_analysis":
        return currentScreen === "gap_analysis";
      case "recommendations":
        return currentScreen === "recommendations" || currentScreen === "resume_improvement";
      case "tailored_resume":
        return currentScreen === "tailored_resume";
      case "interview_simulator":
        return currentScreen === "interview_simulator";
      case "project_recommendations":
        return currentScreen === "project_recommendations";
      case "evidence":
        return currentScreen === "evidence";
      case "latex_studio":
        return currentScreen === "latex_studio";
      default:
        return false;
    }
  };

  return (
    <div className="app-shell flex flex-col md:flex-row min-h-screen bg-surface-subtle">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        skillCount={skillCount}
        criticalGapCount={criticalGapCount}
        candidateName={candidateName}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      <div className="main-wrapper flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          activeRole={activeRole}
          hasResume={hasResume}
          hasJob={hasJob}
          onReset={onReset}
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
          currentUser={currentUser}
          onLogout={onLogout}
          onNavigate={onNavigate}
        />
        <main className="content-container flex-1 p-4 md:p-7 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border-subtle z-30 px-2 py-1.5 flex justify-around items-center shadow-lg">
        <button
          onClick={() => onNavigate("dashboard")}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            isNavActive("dashboard") ? "text-brand-blue font-bold" : "text-content-secondary"
          }`}
        >
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => onNavigate("resume_upload")}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            isNavActive("resume") ? "text-brand-blue font-bold" : "text-content-secondary"
          }`}
        >
          <FileText size={17} />
          <span>Resume</span>
        </button>

        <button
          onClick={() => onNavigate("skill_matrix")}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            isNavActive("skills") ? "text-brand-blue font-bold" : "text-content-secondary"
          }`}
        >
          <BarChart2 size={17} />
          <span>Skills</span>
        </button>

        <button
          onClick={() => onNavigate("jd_analysis")}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            isNavActive("job_analysis") ? "text-brand-blue font-bold" : "text-content-secondary"
          }`}
        >
          <Briefcase size={17} />
          <span>Job</span>
        </button>

        <button
          onClick={() => onNavigate("gap_analysis")}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            isNavActive("gap_analysis") ? "text-brand-blue font-bold" : "text-content-secondary"
          }`}
        >
          <GitCompare size={17} />
          <span>Gaps</span>
        </button>

        <button
          onClick={() => onNavigate("resume_improvement")}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            isNavActive("recommendations") ? "text-brand-blue font-bold" : "text-content-secondary"
          }`}
        >
          <FileCheck2 size={17} />
          <span>Advise</span>
        </button>
      </nav>
    </div>
  );
};
