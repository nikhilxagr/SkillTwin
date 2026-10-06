import React, { useState } from "react";
import {
  Code2,
  Cpu,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  FileCode,
  Terminal,
  Server,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check,
  RotateCcw,
  Target,
  Sparkles,
} from "lucide-react";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import { EmptyState } from "../common/EmptyState.js";
import type {
  ProjectRecommendationReport,
  RecommendedProject,
  ProjectBlueprint,
  JobExtraction,
  SkillMatrix,
  GapAnalysisReport,
} from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface ProjectRecommendationsViewProps {
  report: ProjectRecommendationReport | null;
  blueprint: ProjectBlueprint | null;
  job?: JobExtraction | null;
  matrix?: SkillMatrix | null;
  gapReport?: GapAnalysisReport | null;
  onGenerateBlueprint: (projectId: string) => Promise<ProjectBlueprint | null>;
  onRefreshRecommendations?: () => void;
  onNavigate: (screen: ActiveScreen) => void;
  isLoading?: boolean;
}

export const ProjectRecommendationsView: React.FC<ProjectRecommendationsViewProps> = ({
  report,
  blueprint,
  job,
  matrix,
  gapReport,
  onGenerateBlueprint,
  onRefreshRecommendations,
  onNavigate,
  isLoading = false,
}) => {
  const [activeBlueprintProject, setActiveBlueprintProject] = useState<ProjectBlueprint | null>(
    blueprint
  );
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [blueprintLoadingId, setBlueprintLoadingId] = useState<string | null>(null);
  const [expandedArchitectureIds, setExpandedArchitectureIds] = useState<Record<string, boolean>>({
    "proj-workflow-platform": true,
  });
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<number | null>(null);
  const [copiedAllSpecs, setCopiedAllSpecs] = useState(false);

  const toggleArchitecture = (projectId: string) => {
    setExpandedArchitectureIds((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleOpenBlueprint = async (project: RecommendedProject) => {
    setBlueprintLoadingId(project.id);
    try {
      const result = await onGenerateBlueprint(project.id);
      if (result) {
        setActiveBlueprintProject(result);
        setIsBlueprintModalOpen(true);
      }
    } finally {
      setBlueprintLoadingId(null);
    }
  };

  const handleCopySnippet = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedSnippetIndex(index);
    setTimeout(() => setCopiedSnippetIndex(null), 2000);
  };

  const handleCopyAllSpecs = (bp: ProjectBlueprint) => {
    const text = `# ${bp.projectTitle} - Project Blueprint
${bp.summary}

## System Topology
${bp.systemTopology}

## API Endpoints
${bp.apiEndpoints.map((e) => `- ${e.method} ${e.path} (Auth: ${e.authRequired}): ${e.description}`).join("\n")}

## Database Schemas
${bp.databaseSchemaDraft.map((d) => `### Table: ${d.tableName}\n${d.purpose}\n${d.keyFields.join("\n")}`).join("\n\n")}

## Verification Checklist
${bp.verificationChecklist.map((c) => `- ${c.task}: \`${c.verificationCommand}\` (${c.proofArtifact})`).join("\n")}

## Resume Bullet Points
${bp.resumeBulletPoints.map((b) => `- ${b}`).join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopiedAllSpecs(true);
    setTimeout(() => setCopiedAllSpecs(false), 2000);
  };

  if (!report || report.projects.length === 0) {
    return (
      <div className="flex flex-col gap-6" data-testid="project-recommendations-empty">
        <EmptyState
          icon={<Code2 size={36} />}
          title="No Project Recommendations Available"
          description="Project recommendations are generated from your Target Job Description, verified Skill Matrix, and identified Gaps to specifically address missing skills."
          actionText="Upload Job Description"
          onAction={() => onNavigate("jd_upload")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="project-recommendations-view">
      {/* 1. Header Context Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
              <Cpu size={12} /> Project Recommendation Engine
            </span>
            <span className="text-xs text-slate-500">
              Grounded in Target Job & Gap Analysis
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" data-testid="projects-title">
            Recommended Engineering Projects: {report.targetRole}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Targeting your verified skill gaps with production-grade engineering platforms. These projects yield verifiable code artifacts (Docker configurations, automated test suites, distributed caches, and cloud infrastructure) that directly resolve employer requirements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onRefreshRecommendations && (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={13} />}
              onClick={onRefreshRecommendations}
              disabled={isLoading}
            >
              Re-generate
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("gap_analysis")}
          >
            Review Gaps
          </Button>
        </div>
      </div>

      {/* 2. Target Gaps Summary Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-blue-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-800">
            Identified Target Gaps to Close:
          </span>
          <div className="flex flex-wrap gap-1.5 ml-1">
            {report.targetedGapSkills.map((gap) => (
              <span
                key={gap}
                className="text-xs font-medium bg-blue-100/80 text-blue-800 border border-blue-200 px-2 py-0.5 rounded"
              >
                {gap}
              </span>
            ))}
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          Non-tutorial implementations with comprehensive evidence specifications
        </div>
      </div>

      {/* 3. Recommended Projects List */}
      <div className="flex flex-col gap-6">
        {report.projects.map((project, index) => {
          const isArchExpanded = expandedArchitectureIds[project.id] ?? false;

          return (
            <div
              key={project.id}
              className="bg-white border-2 border-slate-200 hover:border-blue-300 rounded-lg p-6 shadow-sm flex flex-col gap-5 transition-all"
              data-testid={`project-card-${project.id}`}
            >
              {/* Top Bar: Title, Difficulty, Duration */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-3 pb-4 border-b border-slate-100">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded">
                      Project #{index + 1}
                    </span>
                    <Badge variant={project.difficulty === "Production-Grade" ? "info" : "neutral"}>
                      {project.difficulty}
                    </Badge>
                    <span className="text-xs text-slate-500 inline-flex items-center gap-1 font-medium">
                      <Clock size={12} /> {project.estimatedDuration}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    {project.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-center">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FileCode size={14} />}
                    onClick={() => handleOpenBlueprint(project)}
                    disabled={blueprintLoadingId === project.id}
                    data-testid={`btn-blueprint-${project.id}`}
                  >
                    {blueprintLoadingId === project.id ? "Generating..." : "Generate Project Blueprint"}
                  </Button>
                </div>
              </div>

              {/* Relevance Box */}
              <div className="bg-blue-50/70 border-l-4 border-blue-600 p-3.5 rounded-r text-xs text-slate-800 leading-relaxed">
                <strong className="text-blue-900 block font-semibold mb-1">
                  Why this project is relevant:
                </strong>
                {project.whyRelevant}
              </div>

              {/* Skills Demonstrated */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Skills Demonstrated
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.skillsDemonstrated.map((skill) => {
                    const isTargetGap = project.targetedGaps.some(
                      (g) => g.toLowerCase() === skill.toLowerCase()
                    );
                    return (
                      <span
                        key={skill}
                        className={`text-xs px-2.5 py-1 rounded font-medium inline-flex items-center gap-1 ${
                          isTargetGap
                            ? "bg-blue-100 text-blue-800 border border-blue-300 font-semibold"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {isTargetGap && <Check size={11} className="text-blue-700" />}
                        {skill}
                        {isTargetGap && (
                          <span className="text-[10px] text-blue-600 uppercase font-bold ml-0.5">
                            Gap
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Suggested Stack */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Suggested Tech Stack
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {project.suggestedStack.map((stackGroup) => (
                    <div
                      key={stackGroup.category}
                      className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs"
                    >
                      <span className="font-semibold text-slate-800 block mb-1 text-[11px]">
                        {stackGroup.category}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {stackGroup.technologies.map((t) => (
                          <span
                            key={t}
                            className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[11px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Features */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Production Features (Non-Tutorial)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {project.features.map((feature, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-start gap-2 text-xs text-slate-700 bg-white border border-slate-200 p-2.5 rounded shadow-2xs"
                    >
                      <CheckCircle2 size={14} className="text-blue-600 mt-0.5 shrink-0" />
                      <span className="leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architecture Section (Collapsible) */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleArchitecture(project.id)}
                  className="w-full bg-slate-50 hover:bg-slate-100 p-3.5 flex justify-between items-center text-xs font-bold text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-blue-600" />
                    <span>System Architecture: {project.architecture.pattern}</span>
                  </div>
                  {isArchExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isArchExpanded && (
                  <div className="p-4 bg-white flex flex-col gap-4 text-xs">
                    <div>
                      <strong className="text-slate-800 block mb-1 font-semibold">
                        Architectural Overview:
                      </strong>
                      <p className="text-slate-600 leading-relaxed">
                        {project.architecture.overview}
                      </p>
                    </div>

                    {/* Components */}
                    <div>
                      <strong className="text-slate-800 block mb-2 font-semibold">
                        System Components & Boundaries:
                      </strong>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {project.architecture.components.map((comp) => (
                          <div
                            key={comp.name}
                            className="bg-slate-50 border border-slate-200 rounded p-3"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-900">{comp.name}</span>
                              <div className="flex gap-1">
                                {comp.technologies.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] bg-slate-200/80 text-slate-800 px-1 py-0.5 rounded font-mono"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">{comp.role}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Flow */}
                    <div>
                      <strong className="text-slate-800 block mb-1.5 font-semibold">
                        Execution Data Flow:
                      </strong>
                      <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col gap-1.5">
                        {project.architecture.dataFlow.map((step, sIdx) => (
                          <div key={sIdx} className="text-slate-700 leading-relaxed font-mono text-[11px]">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Storage & Deployment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <strong className="text-slate-800 block mb-1 font-semibold">
                          Storage & Caching Strategy:
                        </strong>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {project.architecture.storageAndCaching}
                        </p>
                      </div>
                      <div>
                        <strong className="text-slate-800 block mb-1 font-semibold">
                          Containerization & Cloud Deployment:
                        </strong>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {project.architecture.containerizationAndDeployment}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Milestones Roadmap */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Implementation Milestones
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {project.milestones.map((m) => (
                    <div
                      key={m.milestoneNumber}
                      className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            Phase {m.milestoneNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {m.duration}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mb-2 leading-snug">
                          {m.title}
                        </h4>
                        <div className="flex flex-col gap-1 text-[11px] text-slate-600 mb-2">
                          {m.objectives.map((obj, oIdx) => (
                            <div key={oIdx} className="flex items-start gap-1">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{obj}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                        <strong className="text-slate-700">Proof:</strong> {m.evidenceTarget}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Evidence */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Expected Verifiable Evidence
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {project.expectedEvidence.map((ev, evIdx) => (
                    <div
                      key={evIdx}
                      className="bg-white border border-slate-200 rounded p-3 flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          {ev.category}
                        </span>
                        <div className="text-xs font-semibold text-slate-900 leading-snug mb-2">
                          {ev.artifact}
                        </div>
                        <div className="text-[11px] text-slate-600 mb-2">
                          <strong className="text-slate-700">Verification:</strong> {ev.verificationMethod}
                        </div>
                      </div>
                      {ev.targetMetric && (
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-[10px] text-blue-700 font-medium">
                          Metric: {ev.targetMetric}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<FileCode size={14} />}
                  onClick={() => handleOpenBlueprint(project)}
                  disabled={blueprintLoadingId === project.id}
                >
                  {blueprintLoadingId === project.id ? "Generating..." : "Generate Project Blueprint"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Project Blueprint Modal / Slide-out */}
      {isBlueprintModalOpen && activeBlueprintProject && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          data-testid="project-blueprint-modal"
        >
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-start bg-slate-50">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Technical Project Blueprint
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {activeBlueprintProject.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeBlueprintProject.projectTitle}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={copiedAllSpecs ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  onClick={() => handleCopyAllSpecs(activeBlueprintProject)}
                >
                  {copiedAllSpecs ? "Copied!" : "Copy Full Blueprint"}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsBlueprintModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs text-slate-700">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-slate-800 leading-relaxed">
                {activeBlueprintProject.summary}
              </div>

              {/* System Topology */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  System Topology & Service Flow
                </span>
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg font-mono text-[11px] leading-relaxed">
                  {activeBlueprintProject.systemTopology}
                </div>
              </div>

              {/* API Endpoints */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  REST API Route Specifications
                </span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Path</th>
                        <th className="p-2.5">Auth</th>
                        <th className="p-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeBlueprintProject.apiEndpoints.map((ep, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-mono font-bold text-blue-600">{ep.method}</td>
                          <td className="p-2.5 font-mono text-slate-800">{ep.path}</td>
                          <td className="p-2.5">
                            {ep.authRequired ? (
                              <Badge variant="warning">Required</Badge>
                            ) : (
                              <Badge variant="neutral">Public</Badge>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600">{ep.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Database Schema Outline */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  PostgreSQL Relational Schema Specifications
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeBlueprintProject.databaseSchemaDraft.map((table, tIdx) => (
                    <div key={tIdx} className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                        <span className="font-mono font-bold text-slate-900">
                          Table: {table.tableName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{table.purpose}</p>
                      <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-700 flex flex-col gap-0.5">
                        {table.keyFields.map((f, fIdx) => (
                          <div key={fIdx}>{f}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Templates */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Production Code Templates & Infrastructure Manifests
                </span>
                <div className="flex flex-col gap-4">
                  {activeBlueprintProject.codeTemplates.map((template, idx) => (
                    <div
                      key={template.filename}
                      className="border border-slate-200 rounded-lg overflow-hidden bg-slate-900 text-slate-100"
                    >
                      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-400">{template.filename}</span>
                          <span className="text-slate-400 text-[11px]">• {template.description}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(template.content, idx)}
                          className="text-slate-300 hover:text-white flex items-center gap-1 text-[11px] bg-slate-700 px-2 py-0.5 rounded transition-colors"
                        >
                          {copiedSnippetIndex === idx ? (
                            <>
                              <Check size={12} className="text-green-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto text-slate-200">
                        <code>{template.content}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Evidence Verification Checklist
                </span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <tr>
                        <th className="p-2.5">Verification Task</th>
                        <th className="p-2.5">Proof Artifact</th>
                        <th className="p-2.5">Terminal Verification Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeBlueprintProject.verificationChecklist.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-medium text-slate-900">{item.task}</td>
                          <td className="p-2.5 text-slate-600">{item.proofArtifact}</td>
                          <td className="p-2.5 font-mono text-[11px] text-blue-700 bg-blue-50/40">
                            {item.verificationCommand}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resume Bullet Points */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recommended Resume Bullet Points (Post-Completion)
                </span>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col gap-2">
                  {activeBlueprintProject.resumeBulletPoints.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsBlueprintModalOpen(false)}
              >
                Close Blueprint
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
