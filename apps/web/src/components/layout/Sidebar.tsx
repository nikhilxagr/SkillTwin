import React from "react";
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  Briefcase,
  GitCompare,
  FileCheck2,
  Terminal,
  ShieldCheck,
  Layers,
  MessageSquare,
  Code2,
  X,
} from "lucide-react";
import type { ActiveScreen } from "../../types/navigation.js";

interface SidebarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  skillCount: number;
  criticalGapCount: number;
  candidateName: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  skillCount,
  criticalGapCount,
  candidateName,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const isScreenActive = (
    target: "dashboard" | "resume" | "skills" | "job_analysis" | "gap_analysis" | "recommendations" | "tailored_resume" | "interview_simulator" | "project_recommendations" | "evidence"
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
      default:
        return false;
    }
  };

  const handleNavClick = (screen: ActiveScreen) => {
    onNavigate(screen);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <aside
      className={`sidebar ${
        isMobileOpen
          ? "fixed inset-y-0 left-0 z-50 w-64 shadow-2xl flex flex-col bg-white"
          : "hidden md:flex"
      }`}
    >
      <div className="sidebar-header">
        <div
          className="brand-title"
          style={{ cursor: "pointer" }}
          onClick={() => handleNavClick("landing")}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "5px",
              background: "var(--color-primary-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Terminal size={14} />
          </div>
          Skill<span>Twin</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              padding: "2px 6px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              color: "var(--text-muted)",
            }}
          >
            v0.2
          </span>
          {isMobileOpen && onMobileClose && (
            <button
              onClick={onMobileClose}
              className="p-1 rounded text-content-secondary hover:bg-surface-subtle md:hidden"
              aria-label="Close Navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingBottom: "20px" }}>
        <div className="nav-section-label">Navigation</div>
        <div className="nav-list">
          {/* 1. Dashboard */}
          <button
            data-testid="nav-dashboard"
            className={`nav-button ${isScreenActive("dashboard") ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>

          {/* 2. Resume */}
          <button
            data-testid="nav-resume"
            className={`nav-button ${isScreenActive("resume") ? "active" : ""}`}
            onClick={() => handleNavClick("resume_upload")}
          >
            <FileText size={16} />
            <span>Resume</span>
          </button>

          {/* 3. Skills */}
          <button
            data-testid="nav-matrix"
            className={`nav-button ${isScreenActive("skills") ? "active" : ""}`}
            onClick={() => handleNavClick("skill_matrix")}
          >
            <BarChart2 size={16} />
            <span>Skills</span>
            {skillCount > 0 && <span className="nav-badge">{skillCount}</span>}
          </button>

          {/* 4. Job Analysis */}
          <button
            data-testid="nav-jd-analysis"
            className={`nav-button ${isScreenActive("job_analysis") ? "active" : ""}`}
            onClick={() => handleNavClick("jd_analysis")}
          >
            <Briefcase size={16} />
            <span>Job Analysis</span>
          </button>
          <button
            data-testid="nav-jd-upload"
            style={{ display: "none" }}
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => handleNavClick("jd_upload")}
          >
            Upload Job Description
          </button>

          {/* 5. Gap Analysis */}
          <button
            data-testid="nav-gap-analysis"
            className={`nav-button ${isScreenActive("gap_analysis") ? "active" : ""}`}
            onClick={() => handleNavClick("gap_analysis")}
          >
            <GitCompare size={16} />
            <span>Gap Analysis</span>
            {criticalGapCount > 0 && (
              <span
                className="nav-badge"
                style={{
                  background: "var(--color-gap-bg)",
                  color: "var(--color-gap)",
                  border: "1px solid var(--color-gap-border)",
                }}
              >
                {criticalGapCount}
              </span>
            )}
          </button>

          {/* 6. Recommendations */}
          <button
            data-testid="nav-resume-optimizer"
            className={`nav-button ${isScreenActive("recommendations") ? "active" : ""}`}
            onClick={() => handleNavClick("resume_improvement")}
          >
            <FileCheck2 size={16} />
            <span>Recommendations</span>
          </button>

          {/* 7. Tailored Resume (Phase 7) */}
          <button
            data-testid="nav-tailored-resume"
            className={`nav-button ${isScreenActive("tailored_resume") ? "active" : ""}`}
            onClick={() => handleNavClick("tailored_resume")}
          >
            <Layers size={16} />
            <span>Tailored Resume</span>
          </button>

          {/* 8. Interview Simulator (Phase 9) */}
          <button
            data-testid="nav-interview-simulator"
            className={`nav-button ${isScreenActive("interview_simulator") ? "active" : ""}`}
            onClick={() => handleNavClick("interview_simulator")}
          >
            <MessageSquare size={16} />
            <span>Interview Simulator</span>
          </button>

          {/* 9. Recommended Projects (Phase 10) */}
          <button
            data-testid="nav-project-recommendations"
            className={`nav-button ${isScreenActive("project_recommendations") ? "active" : ""}`}
            onClick={() => handleNavClick("project_recommendations")}
          >
            <Code2 size={16} />
            <span>Recommended Projects</span>
          </button>

          {/* 10. Evidence Verification (Phase 11) */}
          <button
            data-testid="nav-evidence"
            className={`nav-button ${isScreenActive("evidence") ? "active" : ""}`}
            onClick={() => handleNavClick("evidence")}
          >
            <ShieldCheck size={16} />
            <span>Evidence</span>
          </button>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="active-profile-card">
          <div className="avatar-badge">
            {candidateName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase() || "ME"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {candidateName || "Developer Profile"}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--color-match)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <ShieldCheck size={11} /> Evidence Verified
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop / Static Sidebar */}
      {sidebarContent}

      {/* Mobile Backdrop Overlay when drawer is open */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
    </>
  );
};
