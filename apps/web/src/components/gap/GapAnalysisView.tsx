import React, { useState } from "react";
import {
  GitCompare,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Star,
  AlertCircle,
} from "lucide-react";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import { ProgressBar } from "../common/ProgressBar.js";
import { EmptyState } from "../common/EmptyState.js";
import { GapItemCard } from "./GapItemCard.js";
import type { GapAnalysisReport, GapCategory } from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface GapAnalysisViewProps {
  report: GapAnalysisReport | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLoadSample: () => void;
  onRecomputeGap?: () => void;
  onRunOptimization?: () => void;
  loading?: boolean;
}

export const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({
  report,
  onNavigate,
  onLoadSample,
  onRecomputeGap,
  onRunOptimization,
  loading = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | GapCategory>("ALL");

  if (!report) {
    return (
      <EmptyState
        icon={<GitCompare size={24} />}
        title="Gap Analysis Not Available"
        description="Upload both your resume and a target job description to compute your deterministic 5-tier gap analysis."
        actionText={onRecomputeGap ? "Compute Gap Analysis Now" : "Upload Job Description"}
        onAction={onRecomputeGap ? onRecomputeGap : () => onNavigate("jd_upload")}
        secondaryActionText="Load Sample Analysis"
        onSecondaryAction={onLoadSample}
      />
    );
  }

  // Combine all items with deduplication by canonicalName
  const allItemsMap = new Map();
  for (const item of [
    ...report.criticalGaps,
    ...report.partialGaps,
    ...report.weakEvidence,
    ...report.strongMatches,
    ...report.optionalGaps,
  ]) {
    allItemsMap.set(item.canonicalName.toLowerCase(), item);
  }
  const allItems = Array.from(allItemsMap.values());

  const displayedItems =
    selectedFilter === "ALL"
      ? allItems
      : allItems.filter((item) => item.status === selectedFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Deterministic Gap Analysis
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Benchmarking <strong style={{ color: "var(--text-primary)" }}>{report.targetRole}</strong>{" "}
            {report.company && `at ${report.company}`} against your verified Skill Matrix.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {onRecomputeGap && (
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw size={13} />}
              loading={loading}
              onClick={onRecomputeGap}
            >
              Re-run Gap Analysis
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={<FileCheck2 size={13} />}
            onClick={() => {
              if (onRunOptimization) {
                onRunOptimization();
              } else {
                onNavigate("resume_improvement");
              }
            }}
          >
            Generate Resume Recommendations
          </Button>
        </div>
      </div>

      {/* Alignment Scorecard */}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Role Alignment Score
              </span>
              <Badge variant={report.summary.alignmentRating === "Strong" ? "match" : "partial"}>
                {report.summary.alignmentRating} Alignment
              </Badge>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
              <span className="font-mono" style={{ fontSize: "44px", fontWeight: 800, color: "var(--text-primary)" }}>
                {report.summary.alignmentScore}%
              </span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                deterministic requirement match
              </span>
            </div>
            <ProgressBar value={report.summary.alignmentScore} height={8} />
          </div>

          <div
            style={{
              padding: "16px",
              background: "var(--bg-elevated)",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              fontSize: "13.5px",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
            }}
          >
            <p>{report.summary.alignmentExplanation}</p>
          </div>
        </div>
      </Card>

      {/* 5-Bucket Metric Ribbon */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div
          onClick={() => setSelectedFilter("MATCH")}
          style={{
            padding: "14px 16px",
            background: "rgba(16, 185, 129, 0.08)",
            borderRadius: "8px",
            border: selectedFilter === "MATCH" ? "2px solid #10b981" : "1px solid rgba(16, 185, 129, 0.25)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
            <CheckCircle2 size={13} />
            <span>Strong Matches</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>
            {report.summary.matchCount}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Full requirement met</div>
        </div>

        <div
          onClick={() => setSelectedFilter("PARTIAL")}
          style={{
            padding: "14px 16px",
            background: "rgba(245, 158, 11, 0.08)",
            borderRadius: "8px",
            border: selectedFilter === "PARTIAL" ? "2px solid #f59e0b" : "1px solid rgba(245, 158, 11, 0.25)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
            <TrendingUp size={13} />
            <span>Partial Matches</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>
            {report.summary.partialCount}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Lower proficiency</div>
        </div>

        <div
          onClick={() => setSelectedFilter("GAP")}
          style={{
            padding: "14px 16px",
            background: "rgba(239, 68, 68, 0.08)",
            borderRadius: "8px",
            border: selectedFilter === "GAP" ? "2px solid #ef4444" : "1px solid rgba(239, 68, 68, 0.25)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
            <AlertCircle size={13} />
            <span>Critical Gaps</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>
            {report.summary.criticalGapCount}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Missing mandatory</div>
        </div>

        <div
          onClick={() => setSelectedFilter("WEAK_EVIDENCE")}
          style={{
            padding: "14px 16px",
            background: "rgba(234, 179, 8, 0.08)",
            borderRadius: "8px",
            border: selectedFilter === "WEAK_EVIDENCE" ? "2px solid #eab308" : "1px solid rgba(234, 179, 8, 0.25)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#eab308", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
            <HelpCircle size={13} />
            <span>Weak Evidence</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#eab308", marginTop: "4px" }}>
            {report.summary.weakEvidenceCount}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Needs corroboration</div>
        </div>

        <div
          onClick={() => setSelectedFilter("OPTIONAL_GAP")}
          style={{
            padding: "14px 16px",
            background: "rgba(100, 116, 139, 0.08)",
            borderRadius: "8px",
            border: selectedFilter === "OPTIONAL_GAP" ? "2px solid #64748b" : "1px solid rgba(100, 116, 139, 0.25)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
            <Star size={13} />
            <span>Optional Skills</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#94a3b8", marginTop: "4px" }}>
            {report.summary.optionalGapCount}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Preferred / nice-to-have</div>
        </div>
      </div>

      {/* 5-Category Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${selectedFilter === "ALL" ? "active" : ""}`}
          onClick={() => setSelectedFilter("ALL")}
        >
          All Assessed Skills ({allItems.length})
        </button>

        <button
          className={`tab-btn ${selectedFilter === "GAP" ? "active" : ""}`}
          onClick={() => setSelectedFilter("GAP")}
          style={{ color: selectedFilter === "GAP" ? "var(--color-gap)" : undefined }}
        >
          🔴 Critical Gaps ({report.summary.criticalGapCount})
        </button>

        <button
          className={`tab-btn ${selectedFilter === "PARTIAL" ? "active" : ""}`}
          onClick={() => setSelectedFilter("PARTIAL")}
          style={{ color: selectedFilter === "PARTIAL" ? "var(--color-partial)" : undefined }}
        >
          🟠 Partial Gaps ({report.summary.partialCount})
        </button>

        <button
          className={`tab-btn ${selectedFilter === "WEAK_EVIDENCE" ? "active" : ""}`}
          onClick={() => setSelectedFilter("WEAK_EVIDENCE")}
          style={{ color: selectedFilter === "WEAK_EVIDENCE" ? "var(--color-weak)" : undefined }}
        >
          🟡 Weak Evidence ({report.summary.weakEvidenceCount})
        </button>

        <button
          className={`tab-btn ${selectedFilter === "MATCH" ? "active" : ""}`}
          onClick={() => setSelectedFilter("MATCH")}
          style={{ color: selectedFilter === "MATCH" ? "var(--color-match)" : undefined }}
        >
          🟢 Strong Matches ({report.summary.matchCount})
        </button>

        <button
          className={`tab-btn ${selectedFilter === "OPTIONAL_GAP" ? "active" : ""}`}
          onClick={() => setSelectedFilter("OPTIONAL_GAP")}
        >
          ⚪ Optional Gaps ({report.summary.optionalGapCount})
        </button>
      </div>

      {/* Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {displayedItems.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            No skills found under the selected category.
          </div>
        ) : (
          displayedItems.map((item) => <GapItemCard key={item.canonicalName} item={item} />)
        )}
      </div>
    </div>
  );
};
