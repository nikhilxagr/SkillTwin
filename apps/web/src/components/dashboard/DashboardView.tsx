import React, { useMemo } from "react";
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
  Layers,
  Award,
  Zap,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  ChevronRight,
} from "lucide-react";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import { ProgressBar } from "../common/ProgressBar.js";
import { EmptyState } from "../common/EmptyState.js";
import {
  computeCareerReadiness,
  type ResumeExtraction,
  type SkillMatrix,
  type JobExtraction,
  type GapAnalysisReport,
  type CareerReadinessReport,
  type NextBestAction,
  type ReadinessAreaItem,
  type TopJobGapItem,
} from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface DashboardViewProps {
  resume: ResumeExtraction | null;
  matrix: SkillMatrix | null;
  job?: JobExtraction | null;
  gapReport: GapAnalysisReport | null;
  readinessReport?: CareerReadinessReport | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLoadSample: () => void;
  onRefreshReadiness?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  resume,
  matrix,
  job,
  gapReport,
  readinessReport: externalReport,
  onNavigate,
  onLoadSample,
  onRefreshReadiness,
}) => {
  if (!matrix) {
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

  // Derive deterministic career readiness report if not supplied externally
  const report: CareerReadinessReport = useMemo(() => {
    if (externalReport) return externalReport;
    return computeCareerReadiness({
      matrix,
      resume,
      job: job || null,
      gapReport,
    });
  }, [externalReport, matrix, resume, job, gapReport]);

  const targetRole = report.targetRole || job?.title || "Senior Full Stack Engineer";
  const targetCompany = report.targetCompany || job?.company || "Linear Systems Inc.";
  const candidateName = report.candidateName || resume?.profile?.name || "Candidate";

  const getRatingBadgeVariant = (rating: string): "match" | "partial" | "gap" | "neutral" => {
    switch (rating) {
      case "Job Ready":
        return "match";
      case "Competitive":
        return "match";
      case "Developing":
        return "partial";
      case "Needs Targeted Prep":
      default:
        return "gap";
    }
  };

  const getPriorityBadgeVariant = (priority: string): "gap" | "partial" | "neutral" => {
    switch (priority) {
      case "Critical":
        return "gap";
      case "High":
        return "partial";
      default:
        return "neutral";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "work_experience":
        return <Briefcase size={14} className="text-blue-600" />;
      case "project":
        return <Layers size={14} className="text-blue-600" />;
      case "education_certification":
        return <Award size={14} className="text-blue-600" />;
      default:
        return <FileText size={14} className="text-slate-400" />;
    }
  };

  const handleActionClick = (action: NextBestAction) => {
    const screenMap: Record<string, ActiveScreen> = {
      gap_analysis: "gap_analysis",
      skill_matrix: "skill_matrix",
      resume_improvement: "resume_improvement",
      tailored_resume: "tailored_resume",
      interview_simulator: "interview_simulator",
      jd_upload: "jd_upload",
      resume_upload: "resume_upload",
      project_recommendations: "project_recommendations",
      projects: "project_recommendations",
    };
    if (
      action.targetScreen === "projects" ||
      action.targetScreen === "project_recommendations" ||
      action.title.toLowerCase().includes("project")
    ) {
      onNavigate("project_recommendations");
      return;
    }
    const target = screenMap[action.targetScreen] || "gap_analysis";
    onNavigate(target);
  };

  return (
    <div className="flex flex-col gap-6" data-testid="career-readiness-dashboard">
      {/* 1. Header Context & Quick Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
              <Target size={12} /> Target Benchmark
            </span>
            <span className="text-xs text-slate-500">
              Evaluated {new Date(report.evaluatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" data-testid="dashboard-title">
            Career Readiness: {targetRole}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Target Company: <strong className="text-slate-800">{targetCompany}</strong> • Verifiable readiness score derived deterministically from evidence depth, required skill coverage, and critical gaps.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onRefreshReadiness && (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={13} />}
              onClick={onRefreshReadiness}
            >
              Re-evaluate
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("gap_analysis")}
          >
            Gap Analysis
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("skill_matrix")}
          >
            Skill Matrix
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("interview_simulator")}
          >
            Simulator
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight size={13} />}
            onClick={() => onNavigate("resume_improvement")}
          >
            Resume Optimizer
          </Button>
        </div>
      </div>

      {/* 2. Executive Hero Score & Summary Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Overall Readiness Score Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Overall Career Readiness
              </span>
              <Badge variant={getRatingBadgeVariant(report.overallRating)}>
                {report.overallRating}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-4xl font-extrabold text-blue-600 tracking-tight" data-testid="readiness-score-value">
                {report.overallScore}
              </span>
              <span className="text-lg font-semibold text-slate-400">/ 100</span>
            </div>

            <ProgressBar value={report.overallScore} color="#2563EB" />

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Alignment Component (40%):</span>
                <span className="font-mono font-medium text-slate-800">
                  {report.scoreBreakdown.alignmentComponent.toFixed(1)} pts
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Coverage Component (35%):</span>
                <span className="font-mono font-medium text-slate-800">
                  {report.scoreBreakdown.coverageComponent.toFixed(1)} pts
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Evidence Component (25%):</span>
                <span className="font-mono font-medium text-slate-800">
                  {report.scoreBreakdown.evidenceComponent.toFixed(1)} pts
                </span>
              </div>
              {report.scoreBreakdown.criticalGapPenalty > 0 && (
                <div className="flex justify-between items-center text-red-600 font-medium">
                  <span>Critical Gap Penalty:</span>
                  <span className="font-mono">
                    -{report.scoreBreakdown.criticalGapPenalty} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 leading-normal font-mono bg-slate-50 p-2 rounded border border-slate-100">
            Formula: {report.scoreBreakdown.formula}
          </p>
        </div>

        {/* Right: Executive Summary & Candidate Standing (8 cols) */}
        <div className="lg:col-span-8 bg-blue-50/60 border border-blue-200 rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-900 font-semibold text-sm">
              <Sparkles size={16} className="text-blue-600" />
              <span>Readiness Executive Assessment</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-4" data-testid="readiness-executive-summary">
              {report.executiveSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-blue-200/70">
            <div className="bg-white/80 p-3 rounded border border-blue-100">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-0.5">
                Skills Tracked
              </span>
              <span className="text-lg font-bold text-slate-900">
                {matrix.summary.totalSkills}
              </span>
              <span className="text-xs text-slate-500 block">
                {matrix.summary.demonstratedCount} demonstrated
              </span>
            </div>

            <div className="bg-white/80 p-3 rounded border border-blue-100">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-0.5">
                Role Alignment
              </span>
              <span className="text-lg font-bold text-blue-600">
                {gapReport ? `${gapReport.summary.alignmentScore}%` : `${report.overallScore}%`}
              </span>
              <span className="text-xs text-slate-500 block">
                {report.overallRating}
              </span>
            </div>

            <div className="bg-white/80 p-3 rounded border border-blue-100">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-0.5">
                Required Coverage
              </span>
              <span className="text-lg font-bold text-slate-900">
                {report.skillCoverage.requiredPercentage}%
              </span>
              <span className="text-xs text-slate-500 block">
                {report.skillCoverage.requiredCovered} of {report.skillCoverage.requiredTotal} skills
              </span>
            </div>

            <div className="bg-white/80 p-3 rounded border border-blue-100">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-0.5">
                Critical Gaps
              </span>
              <span className="text-lg font-bold text-red-600">
                {report.skillCoverage.criticalGapsCount}
              </span>
              <span className="text-xs text-slate-500 block">
                Mandatory blockers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Skill Coverage Breakdown Card */}
      <Card
        title="Skill Coverage Breakdown"
        description="Structured assessment separating mandatory role criteria from preferred qualifications."
        action={
          <span className="text-xs text-slate-500 font-medium">
            Overall: <strong className="text-blue-600 font-bold">{report.skillCoverage.overallPercentage}%</strong>
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Required Skills Coverage */}
          <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">Required Role Skills</span>
                <Badge variant="gap">Mandatory</Badge>
              </div>
              <span className="font-mono text-sm font-bold text-blue-600">
                {report.skillCoverage.requiredPercentage}%
              </span>
            </div>
            <ProgressBar value={report.skillCoverage.requiredPercentage} color="#2563EB" />
            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
              <span>Demonstrated: {report.skillCoverage.requiredCovered} of {report.skillCoverage.requiredTotal}</span>
              <span className="text-red-600 font-medium">
                {report.skillCoverage.criticalGapsCount} Critical Gaps
              </span>
            </div>
          </div>

          {/* Preferred Skills Coverage */}
          <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">Preferred Qualifications</span>
                <Badge variant="neutral">Nice to have</Badge>
              </div>
              <span className="font-mono text-sm font-bold text-blue-500">
                {report.skillCoverage.preferredPercentage}%
              </span>
            </div>
            <ProgressBar value={report.skillCoverage.preferredPercentage} color="#60A5FA" />
            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
              <span>Demonstrated: {report.skillCoverage.preferredCovered} of {report.skillCoverage.preferredTotal}</span>
              <span className="text-slate-500">Non-mandatory criteria</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Evidence Strength Distribution Card */}
      <Card
        title="Evidence Strength Distribution"
        description="Depth and origin of documented proof across all skills in your developer profile."
        action={
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Mean Confidence: <strong className="text-blue-600 font-bold">{report.evidenceStrength.averageConfidence}%</strong></span>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {report.evidenceStrength.tiers.map((tier) => (
            <div
              key={tier.tier}
              className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    {getTierIcon(tier.tier)}
                    <span>{tier.label}</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-blue-600">
                    {tier.percentage}%
                  </span>
                </div>
                <ProgressBar value={tier.percentage} color={tier.tier === "claimed_only" ? "#94A3B8" : "#2563EB"} />
                <div className="text-xs text-slate-500 mt-2 mb-2 font-medium">
                  {tier.skillCount} {tier.skillCount === 1 ? "skill" : "skills"} documented
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                {tier.skills.slice(0, 3).map((skillName) => (
                  <span
                    key={skillName}
                    className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                  >
                    {skillName}
                  </span>
                ))}
                {tier.skills.length > 3 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    +{tier.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Strongest Areas vs. Weakest Areas Comparative Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Strongest Areas */}
        <Card
          title="Demonstrated Technical Strengths"
          description="Strongest technology clusters with verified multi-source evidence and highest confidence."
        >
          <div className="flex flex-col gap-3.5">
            {report.strongestAreas.map((area: ReadinessAreaItem) => (
              <div
                key={area.id}
                className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{area.areaName}</span>
                    <Badge variant="match">Demonstrated</Badge>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-600">
                    {area.confidenceScore}% Confidence
                  </span>
                </div>
                <ProgressBar value={area.confidenceScore} color="#2563EB" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  {area.evidenceSummary}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {area.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Weakest Areas */}
        <Card
          title="Weakest Areas / Evidence Deficits"
          description="Categories with missing proof or low proficiency holding back your readiness."
        >
          <div className="flex flex-col gap-3.5">
            {report.weakestAreas.map((area: ReadinessAreaItem) => (
              <div
                key={area.id}
                className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{area.areaName}</span>
                    <Badge variant="gap">Deficit</Badge>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {area.confidenceScore}% Confidence
                  </span>
                </div>
                <ProgressBar value={area.confidenceScore} color="#94A3B8" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  {area.evidenceSummary}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {area.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] bg-white border border-red-200 text-red-700 px-2 py-0.5 rounded font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 6. Top Job Gaps Card */}
      <Card
        title="Top Target Role Gaps"
        description="Priority-ordered skill gaps that create hiring risk for this specific role."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("gap_analysis")}
          >
            Open Gap Analysis ({report.topJobGaps.length})
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Importance</th>
                <th>Priority</th>
                <th>Required vs Current</th>
                <th>Gap Rationale & Action Tip</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {report.topJobGaps.map((gap: TopJobGapItem) => (
                <tr key={gap.id}>
                  <td>
                    <div className="font-semibold text-xs text-slate-900">{gap.skill}</div>
                    <div className="text-[11px] text-slate-500">{gap.category}</div>
                  </td>
                  <td>
                    <Badge variant={gap.importance === "Required" ? "gap" : "neutral"}>
                      {gap.importance}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={getPriorityBadgeVariant(gap.priorityLevel)}>
                      {gap.priorityLevel}
                    </Badge>
                  </td>
                  <td>
                    <div className="text-xs font-medium text-slate-800">
                      Req: {gap.requiredProficiency}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Current: {gap.currentProficiency}
                    </div>
                  </td>
                  <td className="max-w-md">
                    <p className="text-xs text-slate-700 leading-snug">{gap.gapRationale}</p>
                    <p className="text-[11px] text-blue-600 mt-1 font-medium">{gap.actionTip}</p>
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate("gap_analysis")}
                    >
                      Resolve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 7. YOUR NEXT BEST ACTIONS SECTION */}
      <div className="bg-white border-2 border-blue-600 rounded-lg p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                <Zap size={16} />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight" data-testid="next-best-actions-heading">
                Your Next Best Actions
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              High-leverage engineering actions to upgrade your readiness from {report.overallRating} to the next competitive bracket.
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
            {report.nextBestActions.length} Actionable Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.nextBestActions.map((action: NextBestAction) => (
            <div
              key={action.id}
              className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-blue-300 transition-colors shadow-2xs"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {action.rank}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {action.title}
                    </h3>
                  </div>
                  <Badge variant={getPriorityBadgeVariant(action.priority)}>
                    {action.priority}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 mb-2 leading-relaxed">
                  <strong className="text-slate-800">Why it matters:</strong> {action.whyItMatters}
                </div>

                <div className="text-xs text-slate-500 mb-3 bg-white p-2.5 rounded border border-slate-200">
                  <strong className="text-slate-700 block mb-1">Evidence Basis:</strong>
                  {action.evidenceBasis}
                </div>

                <div className="flex flex-col gap-1.5 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Recommended Implementation Steps:
                  </span>
                  {action.actionSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                      <Check size={13} className="text-blue-600 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center mt-2">
                <div className="flex flex-wrap gap-1">
                  {action.relatedSkills.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight size={13} />}
                  onClick={() => handleActionClick(action)}
                >
                  {action.actionButtonText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
