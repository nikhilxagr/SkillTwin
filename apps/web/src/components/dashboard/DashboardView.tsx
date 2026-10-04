import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Upload,
  CheckCircle2,
  Target,
  Clock,
  Briefcase,
  FileText,
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

  // Recent analyses mock records for Phase 1 dashboard
  const recentAnalyses = [
    {
      id: "analysis_1",
      role: gapReport?.targetRole || "Senior Full Stack Engineer",
      company: gapReport?.company || "Linear Systems Inc.",
      score: gapReport?.summary.alignmentScore ?? 58,
      status: (gapReport?.summary.alignmentScore ?? 58) >= 70 ? "Strong Match" : "Needs Attention",
      date: "Today",
      criticalGaps: gapReport?.summary.criticalGapCount ?? 3,
    },
    {
      id: "analysis_2",
      role: "Frontend React Specialist",
      company: "Modern UI Labs",
      score: 82,
      status: "Strong Match",
      date: "2 days ago",
      criticalGaps: 0,
    },
    {
      id: "analysis_3",
      role: "Full Stack Engineer",
      company: "CloudScale Distributed",
      score: 64,
      status: "Partial Match",
      date: "1 week ago",
      criticalGaps: 2,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Profile Summary & Next Actions Banner */}
      <div className="bg-brand-light border border-blue-200 rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-blue mb-1.5">
            <Target size={13} /> Next Action
          </div>
          <h2 className="text-lg font-bold text-brand-navy mb-1">
            {gapReport && gapReport.criticalGaps.length > 0
              ? `Resolve ${gapReport.criticalGaps.length} Critical Gaps: ${gapReport.criticalGaps.map((g) => g.canonicalName).join(", ")}`
              : "Strengthen Project Evidence with Quantifiable Technical Context"}
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            {gapReport && gapReport.criticalGaps.length > 0
              ? "Your demonstrated frontend stack matches the target role, but Docker and Automated Testing lack verifiable proof. Adding tests to your active project will immediately upgrade your profile."
              : "Review your detailed skill matrix to inspect source evidence and verify your technical competencies."}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {gapReport ? (
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight size={13} />}
              onClick={() => onNavigate("gap_analysis")}
            >
              View Gap Analysis
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Upload size={13} />}
              onClick={() => onNavigate("jd_upload")}
            >
              Compare with Target JD
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onNavigate("resume_improvement")}>
            Resume Optimizer
          </Button>
        </div>
      </div>

      {/* 2. Key Readiness KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="stat-card">
          <span className="stat-label">
            <BarChart2 size={13} /> Skills Tracked
          </span>
          <span className="stat-value">{matrix.summary.totalSkills}</span>
          <span className="stat-subtext">
            <strong className="text-status-success">{matrix.summary.demonstratedCount}</strong> demonstrated • {matrix.summary.claimedOnlyCount} claimed only
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            <TrendingUp size={13} /> Role Alignment
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
            <AlertTriangle size={13} /> Critical Gaps
          </span>
          <span className="stat-value text-status-error">
            {gapReport ? gapReport.summary.criticalGapCount : 0}
          </span>
          <span className="stat-subtext">Mandatory skills without evidence</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            <ShieldCheck size={13} /> Evidence Confidence
          </span>
          <span className="stat-value">{matrix.summary.averageConfidence}%</span>
          <span className="stat-subtext">Mean evidence weight across profile</span>
        </div>
      </div>

      {/* 3. Main Dashboard Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Strongest Skills (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title="Demonstrated Technical Strengths"
            description="Skills with multi-source project and commercial evidence."
            action={
              <Button variant="outline" size="sm" onClick={() => onNavigate("skill_matrix")}>
                View Full Matrix ({matrix.items.length})
              </Button>
            }
          >
            <div className="flex flex-col gap-3.5">
              {topSkills.map((skill) => (
                <div
                  key={skill.canonicalName}
                  className="flex flex-col gap-1.5 pb-2.5 border-b border-border-subtle last:border-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-content-primary">{skill.canonicalName}</span>
                      <Badge variant="neutral">{skill.category}</Badge>
                      <Badge variant="match">Demonstrated</Badge>
                    </div>
                    <span className="font-mono text-xs text-content-secondary">
                      {skill.confidence}% Confidence
                    </span>
                  </div>
                  <ProgressBar value={skill.confidence} color="var(--color-match)" />
                  <p className="text-xs text-content-secondary mt-0.5 leading-relaxed">
                    {skill.explanation}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Latest Job Analysis & Skills Needing Attention (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
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
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded bg-surface-subtle border border-border-subtle text-xs text-content-secondary leading-relaxed">
                  {gapReport.summary.alignmentExplanation}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-content-secondary">
                    Critical Gaps ({gapReport.criticalGaps.length})
                  </div>
                  {gapReport.criticalGaps.map((gap) => (
                    <div
                      key={gap.canonicalName}
                      className="flex justify-between items-center p-2.5 bg-status-error/10 border border-status-error/20 rounded"
                    >
                      <div>
                        <span className="font-semibold text-xs text-status-error">
                          {gap.canonicalName}
                        </span>
                        <p className="text-[11px] text-content-secondary mt-0.5">
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
                  className="mt-1"
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

      {/* 4. Recent Analyses Section */}
      <Card
        title="Recent Career Analyses"
        description="Historical benchmark snapshots and role comparisons."
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Target Role & Company</th>
                <th>Alignment Score</th>
                <th>Critical Gaps</th>
                <th>Status</th>
                <th>Analyzed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentAnalyses.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="font-semibold text-xs text-brand-navy">{item.role}</div>
                    <div className="text-[11px] text-content-secondary">{item.company}</div>
                  </td>
                  <td>
                    <span className="font-mono font-bold text-xs text-brand-blue">{item.score}%</span>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-content-secondary">
                      {item.criticalGaps === 0 ? "0 gaps" : `${item.criticalGaps} critical`}
                    </span>
                  </td>
                  <td>
                    <Badge variant={item.score >= 70 ? "match" : "partial"}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="text-xs text-content-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {item.date}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate("gap_analysis")}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
