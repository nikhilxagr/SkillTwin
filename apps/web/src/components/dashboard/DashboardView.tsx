import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Binary,
  Layers,
  Sparkles,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import { ProgressBar } from "../common/ProgressBar.js";
import { EmptyState } from "../common/EmptyState.js";
import type { ResumeExtraction, SkillMatrix, GapAnalysisReport } from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface DashboardViewProps {
  resume: ResumeExtraction | null;
  matrix: SkillMatrix | null;
  gapReport: GapAnalysisReport | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLoadSample: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  resume,
  matrix,
  gapReport,
  onNavigate,
  onLoadSample,
}) => {
  if (!resume || !matrix) {
    return (
      <EmptyState
        icon={<Upload size={24} />}
        title="No Career Evidence Ingested"
        description="Upload your PDF resume to generate your evidence-based skill matrix, or inspect a pre-loaded developer profile."
        actionText="Upload Resume"
        onAction={() => onNavigate("resume_upload")}
        secondaryActionText="Load Sample Profile"
        onSecondaryAction={onLoadSample}
      />
    );
  }

  const topSkills = matrix.items.filter((item) => item.proficiency === "Strong").slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner: What Should I Do Next? */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(15, 23, 42, 0.8))",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "12px",
          padding: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: "720px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-accent)",
              marginBottom: "8px",
            }}
          >
            <Sparkles size={13} /> Recommended Next Action
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            {gapReport && gapReport.criticalGaps.length > 0
              ? `Resolve ${gapReport.criticalGaps.length} Critical Gaps: ${gapReport.criticalGaps.map((g) => g.canonicalName).join(", ")}`
              : "Strengthen Project Evidence with Quantifiable Technical Context"}
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {gapReport && gapReport.criticalGaps.length > 0
              ? "Your frontend stack matches the target role, but Docker and Automated Testing lack implementation proof. Adding tests to your active project will immediately upgrade your profile."
              : "Review your detailed skill matrix to inspect source evidence and verify your technical competencies."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {gapReport ? (
            <Button
              variant="primary"
              icon={<ArrowRight size={14} />}
              onClick={() => onNavigate("gap_analysis")}
            >
              View Gap Analysis
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<Upload size={14} />}
              onClick={() => onNavigate("jd_upload")}
            >
              Compare with Target JD
            </Button>
          )}
          <Button variant="outline" onClick={() => onNavigate("resume_improvement")}>
            Resume Optimizer
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        <div className="stat-card">
          <span className="stat-label">
            <Binary size={14} /> Skills Tracked
          </span>
          <span className="stat-value">{matrix.summary.totalSkills}</span>
          <span className="stat-subtext">
            <strong style={{ color: "var(--color-match)" }}>{matrix.summary.demonstratedCount}</strong> demonstrated • {matrix.summary.claimedOnlyCount} claimed only
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            <TrendingUp size={14} /> Role Alignment
          </span>
          <span className="stat-value">
            {gapReport ? `${gapReport.summary.alignmentScore}%` : "Pending JD"}
          </span>
          <span className="stat-subtext">
            Rating: <Badge variant={gapReport?.summary.alignmentRating === "Strong" ? "match" : "partial"}>
              {gapReport?.summary.alignmentRating || "No JD"}
            </Badge>
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            <AlertTriangle size={14} /> Critical Gaps
          </span>
          <span className="stat-value" style={{ color: "var(--color-gap)" }}>
            {gapReport ? gapReport.summary.criticalGapCount : 0}
          </span>
          <span className="stat-subtext">Mandatory skills without evidence</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            <ShieldCheck size={14} /> Evidence Confidence
          </span>
          <span className="stat-value">{matrix.summary.averageConfidence}%</span>
          <span className="stat-subtext">Mean evidence weight across profile</span>
        </div>
      </div>

      {/* 2-Column Detail Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
        {/* Left: Top Demonstrated Skills */}
        <Card
          title="Demonstrated Technical Strengths"
          description="Skills with multi-source project and commercial evidence."
          action={
            <Button variant="outline" size="sm" onClick={() => onNavigate("skill_matrix")}>
              View Full Matrix ({matrix.items.length})
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {topSkills.map((skill) => (
              <div
                key={skill.canonicalName}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>{skill.canonicalName}</span>
                    <Badge variant="neutral">{skill.category}</Badge>
                    <Badge variant="match">Demonstrated</Badge>
                  </div>
                  <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {skill.confidence}% Confidence
                  </span>
                </div>
                <ProgressBar value={skill.confidence} color="var(--color-match)" />
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {skill.explanation}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Gap & Quick Actions */}
        <Card
          title="Role Requirements Summary"
          description={gapReport ? `Target: ${gapReport.targetRole}` : "No active job description"}
          action={
            <Button variant="outline" size="sm" onClick={() => onNavigate("jd_upload")}>
              Change JD
            </Button>
          }
        >
          {gapReport ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                {gapReport.summary.alignmentExplanation}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Critical Gaps to Address ({gapReport.criticalGaps.length})
                </div>
                {gapReport.criticalGaps.map((gap) => (
                  <div
                    key={gap.canonicalName}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "rgba(239, 68, 68, 0.06)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "6px",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "13px", color: "#fca5a5" }}>
                        {gap.canonicalName}
                      </span>
                      <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Required: {gap.requiredProficiency} • Current: {gap.candidateProficiency}
                      </p>
                    </div>
                    <Badge variant="gap">GAP</Badge>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight size={13} />}
                onClick={() => onNavigate("gap_analysis")}
                style={{ marginTop: "10px" }}
              >
                Open Full Gap Analysis
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={<Upload size={20} />}
              title="Compare with a Job"
              description="Upload a job description to calculate your 5-tier skill match."
              actionText="Upload Job Description"
              onAction={() => onNavigate("jd_upload")}
            />
          )}
        </Card>
      </div>
    </div>
  );
};
