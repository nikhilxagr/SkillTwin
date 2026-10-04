import React, { useState, useMemo } from "react";
import {
  Wand2,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Lock,
  ArrowRight,
  RefreshCw,
  Layers,
  Sparkles,
  Target,
  BookOpen,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code2,
  CheckCircle2,
} from "lucide-react";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import { EmptyState } from "../common/EmptyState.js";
import { BulletDiffCard } from "./BulletDiffCard.js";
import type {
  ResumeOptimizationReport,
  ResumeExtraction,
  OptimizationHighlightTag,
} from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface ResumeOptimizerViewProps {
  optimization: ResumeOptimizationReport | null;
  resume?: ResumeExtraction | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLoadSample: () => void;
  onRecomputeOptimization?: () => void;
}

type TabType =
  | "bullets"
  | "poorly_represented"
  | "keywords"
  | "projects"
  | "sections"
  | "skills_arch"
  | "jd_alignment"
  | "truthful_actions";

export const ResumeOptimizerView: React.FC<ResumeOptimizerViewProps> = ({
  optimization,
  resume,
  onNavigate,
  onLoadSample,
  onRecomputeOptimization,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("bullets");
  const [highlightFilter, setHighlightFilter] = useState<"ALL" | OptimizationHighlightTag>("ALL");

  if (!optimization) {
    return (
      <EmptyState
        icon={<Wand2 size={24} />}
        title="Optimization Report Not Generated"
        description="Run a gap analysis between your resume and a target job to produce evidence-grounded resume suggestions."
        actionText="Compare with Job"
        onAction={() => onNavigate("jd_upload")}
        secondaryActionText="Load Sample Report"
        onSecondaryAction={onLoadSample}
      />
    );
  }

  // Count highlights across all categories
  const highlightCounts = useMemo(() => {
    let matched = 0;
    let missing = 0;
    let weak = 0;
    let recommended = 0;

    for (const kw of optimization.keywordCoverage || []) {
      if (kw.highlightTag === "MATCHED") matched++;
      else if (kw.highlightTag === "MISSING") missing++;
      else if (kw.highlightTag === "WEAK_EVIDENCE") weak++;
      else recommended++;
    }

    weak += (optimization.poorlyRepresentedSkills || []).length;
    recommended += (optimization.bulletImprovements || []).length;
    recommended += (optimization.projectImprovements || []).length;
    recommended += (optimization.sectionRecommendations || []).length;
    recommended += (optimization.jdAlignmentRecommendations || []).length;

    return {
      all: matched + missing + weak + recommended,
      MATCHED: matched,
      MISSING: missing,
      WEAK_EVIDENCE: weak,
      RECOMMENDED: recommended,
    };
  }, [optimization]);

  // Highlight badge helper
  const renderHighlightBadge = (tag: OptimizationHighlightTag | string) => {
    switch (tag) {
      case "MATCHED":
        return (
          <Badge variant="match">
            <CheckCircle2 size={11} style={{ marginRight: "3px" }} /> MATCHED
          </Badge>
        );
      case "MISSING":
        return (
          <Badge variant="gap">
            <AlertTriangle size={11} style={{ marginRight: "3px" }} /> MISSING
          </Badge>
        );
      case "WEAK_EVIDENCE":
        return (
          <Badge variant="partial">
            <AlertTriangle size={11} style={{ marginRight: "3px" }} /> WEAK EVIDENCE
          </Badge>
        );
      case "RECOMMENDED":
      default:
        return (
          <Badge variant="info">
            <Sparkles size={11} style={{ marginRight: "3px" }} /> RECOMMENDED
          </Badge>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>
              Evidence-Grounded Resume Optimizer
            </h2>
            <Badge variant="match">Phase 6 Engine</Badge>
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Target Role: <strong style={{ color: "var(--text-primary)" }}>{optimization.targetRole || "Target Job"}</strong>
            {optimization.company ? ` at ${optimization.company}` : ""} • Original resume remains strictly untouched while targeted recommendations are generated.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {onRecomputeOptimization && (
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={onRecomputeOptimization}
            >
              Recompute
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("gap_analysis")}
          >
            Review Gap Analysis
          </Button>
        </div>
      </div>

      {/* Zero-Fabrication Guarantee Manifesto */}
      <div
        style={{
          padding: "16px 20px",
          background: "linear-gradient(100deg, rgba(16, 185, 129, 0.08), rgba(6, 78, 59, 0.2))",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <ShieldCheck size={28} style={{ color: "var(--color-match)", flexShrink: 0 }} />
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          <strong style={{ color: "var(--text-primary)" }}>Zero-Fabrication Guarantee: </strong>
          SkillTwin will never insert arbitrary performance numbers (e.g. <em>"improved API latency by 40%"</em>) or fictional technologies.
          If evidence is missing, our system explicitly demands genuine implementation before adding claims to your resume.
        </div>
      </div>

      {/* Highlight Tags Ribbon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 18px",
          background: "var(--bg-elevated)",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginRight: "6px" }}>
          Highlight Filter:
        </span>
        <button
          onClick={() => setHighlightFilter("ALL")}
          style={{
            background: highlightFilter === "ALL" ? "var(--bg-surface)" : "transparent",
            border: highlightFilter === "ALL" ? "1px solid var(--border-focus)" : "1px solid transparent",
            color: "var(--text-primary)",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12.5px",
            cursor: "pointer",
            fontWeight: highlightFilter === "ALL" ? 700 : 500,
          }}
        >
          All ({highlightCounts.all})
        </button>
        <button
          onClick={() => setHighlightFilter("MATCHED")}
          style={{
            background: highlightFilter === "MATCHED" ? "rgba(16, 185, 129, 0.15)" : "transparent",
            border: highlightFilter === "MATCHED" ? "1px solid var(--color-match)" : "1px solid transparent",
            color: "var(--color-match)",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12.5px",
            cursor: "pointer",
            fontWeight: highlightFilter === "MATCHED" ? 700 : 500,
          }}
        >
          🟢 MATCHED ({highlightCounts.MATCHED})
        </button>
        <button
          onClick={() => setHighlightFilter("MISSING")}
          style={{
            background: highlightFilter === "MISSING" ? "rgba(239, 68, 68, 0.15)" : "transparent",
            border: highlightFilter === "MISSING" ? "1px solid var(--color-gap)" : "1px solid transparent",
            color: "var(--color-gap)",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12.5px",
            cursor: "pointer",
            fontWeight: highlightFilter === "MISSING" ? 700 : 500,
          }}
        >
          🔴 MISSING ({highlightCounts.MISSING})
        </button>
        <button
          onClick={() => setHighlightFilter("WEAK_EVIDENCE")}
          style={{
            background: highlightFilter === "WEAK_EVIDENCE" ? "rgba(245, 158, 11, 0.15)" : "transparent",
            border: highlightFilter === "WEAK_EVIDENCE" ? "1px solid var(--color-partial)" : "1px solid transparent",
            color: "var(--color-partial)",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12.5px",
            cursor: "pointer",
            fontWeight: highlightFilter === "WEAK_EVIDENCE" ? 700 : 500,
          }}
        >
          🟡 WEAK EVIDENCE ({highlightCounts.WEAK_EVIDENCE})
        </button>
        <button
          onClick={() => setHighlightFilter("RECOMMENDED")}
          style={{
            background: highlightFilter === "RECOMMENDED" ? "rgba(99, 102, 241, 0.15)" : "transparent",
            border: highlightFilter === "RECOMMENDED" ? "1px solid var(--text-accent)" : "1px solid transparent",
            color: "var(--text-accent)",
            padding: "5px 12px",
            borderRadius: "6px",
            fontSize: "12.5px",
            cursor: "pointer",
            fontWeight: highlightFilter === "RECOMMENDED" ? 700 : 500,
          }}
        >
          🔵 RECOMMENDED ({highlightCounts.RECOMMENDED})
        </button>
      </div>

      {/* Main Comparative Before / After Split Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(420px, 1.6fr)", gap: "24px", alignItems: "start" }}>
        
        {/* Left Column: Original Resume (Untouched) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              padding: "16px 20px",
              background: "var(--bg-elevated)",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={15} style={{ color: "var(--text-muted)" }} />
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Original Resume
                </h3>
              </div>
              <Badge variant="neutral">Untouched & Unaltered</Badge>
            </div>

            <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Candidate: <strong style={{ color: "var(--text-primary)" }}>{resume?.profile?.name || optimization.originalResumeSummary?.candidateName || "Candidate"}</strong>
            </div>

            {/* Resume Summary metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
                padding: "10px",
                background: "var(--bg-surface)",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {optimization.originalResumeSummary?.sectionsPresent?.length || 5}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sections</div>
              </div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-accent)" }}>
                  {optimization.originalResumeSummary?.bulletCount || 6}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Bullets</div>
              </div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-match)" }}>
                  {optimization.originalResumeSummary?.skillsMentionedCount || 12}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Skills Listed</div>
              </div>
            </div>

            {/* Sections overview */}
            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Document Sections Present:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(optimization.originalResumeSummary?.sectionsPresent || [
                  "Professional Summary",
                  "Skills",
                  "Work Experience",
                  "Projects",
                  "Education",
                ]).map((sec, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "3px 8px",
                      background: "var(--bg-surface)",
                      borderRadius: "4px",
                      fontSize: "11.5px",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {sec}
                  </span>
                ))}
              </div>
            </div>

            {/* Original Resume Excerpt */}
            {optimization.originalResumeSummary?.rawExcerpt && (
              <div style={{ marginTop: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Original Text Excerpt:
                </span>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg-surface)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    color: "var(--text-secondary)",
                    lineHeight: "1.5",
                    maxHeight: "180px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {optimization.originalResumeSummary.rawExcerpt}
                </div>
              </div>
            )}

            {/* Original Experience bullets if available */}
            {resume?.experience && resume.experience.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  Original Work Experience Bullets:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {resume.experience.slice(0, 2).map((exp, eIdx) => (
                    <div key={eIdx} style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      <strong style={{ color: "var(--text-primary)" }}>{exp.role} @ {exp.company}</strong>
                      <ul style={{ paddingLeft: "18px", marginTop: "4px" }}>
                        {exp.bullets?.slice(0, 2).map((b, bIdx) => (
                          <li key={bIdx} style={{ marginBottom: "3px" }}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recommendations & Actionable Improvements */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Navigation Tabs */}
          <div className="tabs-header" style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
            <button
              className={`tab-btn ${activeTab === "bullets" ? "active" : ""}`}
              onClick={() => setActiveTab("bullets")}
            >
              📝 Bullet Improvements ({optimization.bulletImprovements.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "poorly_represented" ? "active" : ""}`}
              onClick={() => setActiveTab("poorly_represented")}
            >
              ⚠️ Weak Representation ({optimization.poorlyRepresentedSkills?.length || 0})
            </button>
            <button
              className={`tab-btn ${activeTab === "keywords" ? "active" : ""}`}
              onClick={() => setActiveTab("keywords")}
            >
              🎯 Missing Keywords ({optimization.keywordCoverage.filter((k) => k.status === "missing").length})
            </button>
            <button
              className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              🚀 Project Enhancements ({optimization.projectImprovements?.length || 0})
            </button>
            <button
              className={`tab-btn ${activeTab === "sections" ? "active" : ""}`}
              onClick={() => setActiveTab("sections")}
            >
              📑 Section Advice ({optimization.sectionRecommendations?.length || 0})
            </button>
            <button
              className={`tab-btn ${activeTab === "skills_arch" ? "active" : ""}`}
              onClick={() => setActiveTab("skills_arch")}
            >
              🏗️ Skills Layout
            </button>
            <button
              className={`tab-btn ${activeTab === "jd_alignment" ? "active" : ""}`}
              onClick={() => setActiveTab("jd_alignment")}
            >
              🧭 JD Alignment ({optimization.jdAlignmentRecommendations?.length || 0})
            </button>
            <button
              className={`tab-btn ${activeTab === "truthful_actions" ? "active" : ""}`}
              onClick={() => setActiveTab("truthful_actions")}
            >
              🛡️ Directives ({optimization.truthfulRecommendations.length})
            </button>
          </div>

          {/* TAB 1: Bullet Point Improvements */}
          {activeTab === "bullets" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {optimization.bulletImprovements.length === 0 ? (
                <Card>
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    No bullet improvements generated.
                  </div>
                </Card>
              ) : (
                optimization.bulletImprovements
                  .filter((b) => highlightFilter === "ALL" || b.highlightTag === highlightFilter)
                  .map((bullet) => (
                    <BulletDiffCard key={bullet.id} bullet={bullet} />
                  ))
              )}
            </div>
          )}

          {/* TAB 2: Skills Already Present But Poorly Represented */}
          {activeTab === "poorly_represented" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(optimization.poorlyRepresentedSkills || []).length === 0 ? (
                <Card>
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    No poorly represented skills detected. Your claimed skills have corroborating evidence.
                  </div>
                </Card>
              ) : (
                optimization.poorlyRepresentedSkills
                  ?.filter((p) => highlightFilter === "ALL" || p.highlightTag === highlightFilter)
                  .map((skillItem) => (
                    <Card key={skillItem.id}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                              {skillItem.skill}
                            </h4>
                            <Badge variant="neutral">{skillItem.category}</Badge>
                          </div>
                          {renderHighlightBadge(skillItem.highlightTag)}
                        </div>

                        <div>
                          <span style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                            Current Representation on Resume:
                          </span>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", background: "var(--bg-surface)", padding: "8px 12px", borderRadius: "6px" }}>
                            {skillItem.currentResumeContext}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: "11.5px", color: "var(--color-partial)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                            Why It Is Poorly Represented:
                          </span>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                            {skillItem.whyPoorlyRepresented}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: "11.5px", color: "var(--text-accent)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "2px" }}>
                            Recommended Action:
                          </span>
                          <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>
                            {skillItem.recommendation}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: "10px 14px",
                            background: "rgba(245, 158, 11, 0.08)",
                            border: "1px solid rgba(245, 158, 11, 0.25)",
                            borderRadius: "6px",
                            fontSize: "12.5px",
                            color: "#fde68a",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                          }}
                        >
                          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
                          <div>
                            <strong>Evidence Requirement: </strong>
                            {skillItem.evidenceRequiredNote}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          )}

          {/* TAB 3: Missing Keywords & Requirements */}
          {activeTab === "keywords" && (
            <Card title="Target Job Keyword & Requirement Alignment">
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Job Keyword</th>
                      <th>Category</th>
                      <th>Highlight Tag</th>
                      <th>Status & Evidence Guidance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optimization.keywordCoverage
                      .filter((kw) => highlightFilter === "ALL" || kw.highlightTag === highlightFilter)
                      .map((kw, idx) => (
                        <tr key={idx}>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text-primary)" }}>
                              {kw.keyword}
                            </span>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              Importance: {kw.importance || "Required"}
                            </div>
                          </td>
                          <td>
                            <Badge variant="neutral">{kw.category}</Badge>
                          </td>
                          <td>
                            {renderHighlightBadge(kw.highlightTag)}
                          </td>
                          <td style={{ fontSize: "12.5px" }}>
                            {kw.status === "matched" && (
                              <span style={{ color: "var(--text-secondary)" }}>
                                {kw.evidenceSnippet || "Verified in candidate matrix."}
                              </span>
                            )}
                            {kw.status === "partial" && (
                              <div>
                                <span style={{ color: "var(--text-secondary)" }}>{kw.evidenceSnippet}</span>
                                {kw.evidenceRequiredNote && (
                                  <div style={{ color: "var(--color-partial)", fontSize: "11.5px", marginTop: "4px" }}>
                                    ⚠️ {kw.evidenceRequiredNote}
                                  </div>
                                )}
                              </div>
                            )}
                            {kw.status === "weak_evidence" && (
                              <div>
                                <span style={{ color: "var(--text-secondary)" }}>{kw.evidenceSnippet}</span>
                                {kw.evidenceRequiredNote && (
                                  <div style={{ color: "var(--color-partial)", fontSize: "11.5px", marginTop: "4px" }}>
                                    ⚠️ {kw.evidenceRequiredNote}
                                  </div>
                                )}
                              </div>
                            )}
                            {kw.status === "missing" && (
                              <div style={{ color: "var(--color-gap)", fontWeight: 500 }}>
                                {kw.evidenceRequiredNote || "Evidence required before adding to resume."}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 4: Project Improvements */}
          {activeTab === "projects" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(optimization.projectImprovements || []).length === 0 ? (
                <Card>
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    No project improvements available.
                  </div>
                </Card>
              ) : (
                optimization.projectImprovements
                  ?.filter((p) => highlightFilter === "ALL" || p.highlightTag === highlightFilter)
                  .map((proj) => (
                    <Card key={proj.id}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FolderGit2 size={18} style={{ color: "var(--text-accent)" }} />
                            <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                              {proj.projectName}
                            </h4>
                          </div>
                          {renderHighlightBadge(proj.highlightTag)}
                        </div>

                        <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                          <strong>Current Project Summary: </strong>
                          <span>{proj.currentSummary}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: 700 }}>
                            Targeted Skills:
                          </span>
                          {proj.targetedSkills.map((ts, idx) => (
                            <Badge key={idx} variant="neutral">{ts}</Badge>
                          ))}
                        </div>

                        <div
                          style={{
                            padding: "12px 14px",
                            background: "rgba(99, 102, 241, 0.08)",
                            border: "1px solid rgba(99, 102, 241, 0.25)",
                            borderRadius: "6px",
                            fontSize: "13px",
                            color: "var(--text-primary)",
                          }}
                        >
                          <strong style={{ color: "var(--text-accent)" }}>Suggested Architecture Framing: </strong>
                          {proj.suggestedEnhancement}
                        </div>

                        <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <ShieldCheck size={14} style={{ color: "var(--color-match)" }} />
                          <span><strong>Truth-Check Constraint: </strong>{proj.truthCheckNote}</span>
                        </div>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          )}

          {/* TAB 5: Resume Section Recommendations */}
          {activeTab === "sections" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(optimization.sectionRecommendations || []).length === 0 ? (
                <Card>
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    No section recommendations available.
                  </div>
                </Card>
              ) : (
                optimization.sectionRecommendations
                  ?.filter((s) => highlightFilter === "ALL" || s.highlightTag === highlightFilter)
                  .map((sec) => (
                    <Card key={sec.id}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <BookOpen size={16} style={{ color: "var(--text-accent)" }} />
                            <h4 style={{ fontSize: "15.5px", fontWeight: 700, color: "var(--text-primary)" }}>
                              {sec.sectionName}
                            </h4>
                          </div>
                          {renderHighlightBadge(sec.highlightTag)}
                        </div>

                        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          <strong>Current Evaluation: </strong>{sec.currentEvaluation}
                        </div>

                        <div
                          style={{
                            padding: "10px 14px",
                            background: "var(--bg-surface)",
                            borderRadius: "6px",
                            fontSize: "13px",
                            color: "var(--text-primary)",
                            borderLeft: "3px solid var(--text-accent)",
                          }}
                        >
                          <strong>Recommended Strategy: </strong>{sec.recommendedChange}
                        </div>

                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          <strong>Truth Check: </strong>{sec.truthCheckNote}
                        </div>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          )}

          {/* TAB 6: Skills Section Architecture */}
          {activeTab === "skills_arch" && optimization.skillsSectionRecommendation && (
            <Card title="Recommended Skills Section Architecture">
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  <strong>Layout Style: </strong>{optimization.skillsSectionRecommendation.layoutStyle}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  {optimization.skillsSectionRecommendation.categories.map((cat, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "14px 16px",
                        background: "var(--bg-surface)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                        {cat.categoryName}
                      </h4>

                      <div>
                        <span style={{ fontSize: "11px", color: "var(--color-match)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                          🟢 Verified Core Competencies:
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {cat.verifiedSkills.map((vs, sIdx) => (
                            <Badge key={sIdx} variant="match">{vs}</Badge>
                          ))}
                        </div>
                      </div>

                      {cat.developingSkills.length > 0 && (
                        <div style={{ marginTop: "4px" }}>
                          <span style={{ fontSize: "11px", color: "var(--color-partial)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
                            🟡 Developing / Familiar Tools:
                          </span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                            {cat.developingSkills.map((ds, dIdx) => (
                              <Badge key={dIdx} variant="partial">{ds}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <strong style={{ color: "var(--text-primary)" }}>Formatting Advice: </strong>
                  {optimization.skillsSectionRecommendation.formattingAdvice}
                </div>

                <div style={{ fontSize: "12px", color: "var(--color-gap)", fontWeight: 500 }}>
                  ⚠️ <strong>Anti-Fabrication Principle: </strong>
                  {optimization.skillsSectionRecommendation.antiFabricationRule}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 7: Target JD Alignment */}
          {activeTab === "jd_alignment" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(optimization.jdAlignmentRecommendations || []).length === 0 ? (
                <Card>
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    No JD alignment recommendations available.
                  </div>
                </Card>
              ) : (
                optimization.jdAlignmentRecommendations
                  ?.filter((a) => highlightFilter === "ALL" || a.highlightTag === highlightFilter)
                  .map((align) => (
                    <Card key={align.id}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Target size={16} style={{ color: "var(--text-accent)" }} />
                            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                              {align.title}
                            </h4>
                          </div>
                          {renderHighlightBadge(align.highlightTag)}
                        </div>

                        <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                          <strong>Target Job Expectation: </strong>
                          {align.targetJobExpectation}
                        </div>

                        <div
                          style={{
                            padding: "10px 14px",
                            background: "var(--bg-surface)",
                            borderRadius: "6px",
                            fontSize: "13px",
                            color: "var(--text-primary)",
                            borderLeft: "3px solid var(--text-accent)",
                          }}
                        >
                          <strong>Strategic Suggestion: </strong>
                          {align.alignmentSuggestion}
                        </div>

                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          <strong>Truth Check: </strong>{align.truthCheckNote}
                        </div>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          )}

          {/* TAB 8: Truthful Next Actions */}
          {activeTab === "truthful_actions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {optimization.truthfulRecommendations.map((rec) => (
                <Card key={rec.id}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {rec.title}
                      </h4>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Badge variant="neutral">{rec.category.replace("_", " ").toUpperCase()}</Badge>
                        {rec.highlightTag && renderHighlightBadge(rec.highlightTag)}
                      </div>
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                      {rec.description}
                    </p>

                    <div
                      style={{
                        padding: "10px 14px",
                        background: "rgba(234, 179, 8, 0.08)",
                        border: "1px solid rgba(234, 179, 8, 0.25)",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        color: "#fef08a",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong>Truth-Check Directive: </strong>
                        {rec.truthCheckNote}
                      </div>
                    </div>

                    <div style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "4px" }}>
                      <strong>Action to Take: </strong>
                      <span style={{ color: "var(--text-accent)" }}>{rec.suggestedAction}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
