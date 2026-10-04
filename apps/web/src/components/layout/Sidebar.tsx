import React from "react";
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  UploadCloud,
  Briefcase,
  GitCompare,
  FileCheck2,
  Terminal,
  ShieldCheck,
} from "lucide-react";
import type { ActiveScreen } from "../../types/navigation.js";

interface SidebarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  skillCount: number;
  criticalGapCount: number;
  candidateName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  skillCount,
  criticalGapCount,
  candidateName,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div
          className="brand-title"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigate("landing")}
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
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingBottom: "20px" }}>
        <div className="nav-section-label">Core Developer Twin</div>
        <div className="nav-list">
          <button
            data-testid="nav-dashboard"
            className={`nav-button ${currentScreen === "dashboard" ? "active" : ""}`}
            onClick={() => onNavigate("dashboard")}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          <button
            data-testid="nav-resume"
            className={`nav-button ${currentScreen === "resume_upload" || currentScreen === "resume_view" ? "active" : ""}`}
            onClick={() => onNavigate("resume_upload")}
          >
            <FileText size={16} />
            <span>Resume Ingestion</span>
          </button>
          <button
            data-testid="nav-matrix"
            className={`nav-button ${currentScreen === "skill_matrix" ? "active" : ""}`}
            onClick={() => onNavigate("skill_matrix")}
          >
            <BarChart2 size={16} />
            <span>Skill Matrix</span>
            {skillCount > 0 && <span className="nav-badge">{skillCount}</span>}
          </button>
        </div>

        <div className="nav-section-label">Job Intelligence</div>
        <div className="nav-list">
          <button
            data-testid="nav-jd-upload"
            className={`nav-button ${currentScreen === "jd_upload" ? "active" : ""}`}
            onClick={() => onNavigate("jd_upload")}
          >
            <UploadCloud size={16} />
            <span>Target JD Upload</span>
          </button>
          <button
            data-testid="nav-jd-analysis"
            className={`nav-button ${currentScreen === "jd_analysis" ? "active" : ""}`}
            onClick={() => onNavigate("jd_analysis")}
          >
            <Briefcase size={16} />
            <span>JD Requirements</span>
          </button>
          <button
            data-testid="nav-gap-analysis"
            className={`nav-button ${currentScreen === "gap_analysis" ? "active" : ""}`}
            onClick={() => onNavigate("gap_analysis")}
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
        </div>

        <div className="nav-section-label">Optimization</div>
        <div className="nav-list">
          <button
            data-testid="nav-resume-optimizer"
            className={`nav-button ${currentScreen === "resume_improvement" ? "active" : ""}`}
            onClick={() => onNavigate("resume_improvement")}
          >
            <FileCheck2 size={16} />
            <span>Resume Optimizer</span>
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
};
