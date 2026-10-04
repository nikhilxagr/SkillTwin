import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { Badge, type BadgeVariant } from "../common/Badge.js";
import type { ComparisonItem, GapCategory } from "@skilltwin/contracts";

interface GapItemCardProps {
  item: ComparisonItem;
}

function getStatusBadgeVariant(status: GapCategory): BadgeVariant {
  switch (status) {
    case "MATCH":
      return "match";
    case "GAP":
      return "gap";
    case "PARTIAL":
      return "partial";
    case "WEAK_EVIDENCE":
      return "weak";
    case "OPTIONAL_GAP":
      return "optional";
    default:
      return "neutral";
  }
}

function getStatusLabel(status: GapCategory): string {
  switch (status) {
    case "MATCH":
      return "STRONG MATCH";
    case "GAP":
      return "CRITICAL GAP";
    case "PARTIAL":
      return "PARTIAL GAP";
    case "WEAK_EVIDENCE":
      return "WEAK EVIDENCE";
    case "OPTIONAL_GAP":
      return "OPTIONAL GAP";
    default:
      return status;
  }
}

export const GapItemCard: React.FC<GapItemCardProps> = ({ item }) => {
  const badgeVariant = getStatusBadgeVariant(item.status);

  return (
    <div
      style={{
        padding: "18px 20px",
        background: "var(--bg-elevated)",
        borderRadius: "10px",
        border: `1px solid ${
          item.status === "GAP"
            ? "rgba(239, 68, 68, 0.3)"
            : item.status === "MATCH"
            ? "rgba(16, 185, 129, 0.3)"
            : "var(--border-subtle)"
        }`,
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Top Line */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
              {item.canonicalName}
            </span>
            <Badge variant="neutral">{item.category}</Badge>
            <Badge variant={item.importance === "Required" ? "gap" : "optional"}>
              {item.importance}
            </Badge>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            Candidate Confidence:{" "}
            <strong style={{ color: "var(--text-primary)" }}>{item.candidateConfidence}%</strong> (
            {item.evidenceCount} corroborating sources)
          </p>
        </div>

        <Badge variant={badgeVariant}>{getStatusLabel(item.status)}</Badge>
      </div>

      {/* Comparison Level Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "10px 14px",
          background: "var(--bg-surface)",
          borderRadius: "6px",
          border: "1px solid var(--border-subtle)",
          fontSize: "13px",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
            My Demonstrated Level
          </span>
          <div
            style={{
              fontWeight: 700,
              color:
                item.candidateProficiency === "Not Detected"
                  ? "var(--color-gap)"
                  : item.candidateProficiency === "Strong"
                  ? "var(--color-match)"
                  : "var(--text-primary)",
            }}
          >
            {item.candidateProficiency}
          </div>
        </div>

        <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />

        <div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Job Required Level
          </span>
          <div style={{ fontWeight: 700, color: "var(--text-accent)" }}>{item.requiredProficiency}</div>
        </div>
      </div>

      {/* Evidence & Why it is a Gap */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", lineHeight: "1.5" }}>
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Current Evidence: </strong>
          <span style={{ color: "var(--text-secondary)" }}>{item.evidenceSummary}</span>
        </div>

        {item.gapRationale && (
          <div style={{ padding: "8px 12px", background: "var(--bg-canvas)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Why it is a gap: </strong>
            <span style={{ color: "var(--text-secondary)" }}>{item.gapRationale}</span>
          </div>
        )}
      </div>

      {/* Next Action Advice Box */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "6px",
          background:
            item.status === "GAP"
              ? "rgba(239, 68, 68, 0.08)"
              : item.status === "PARTIAL"
              ? "rgba(245, 158, 11, 0.08)"
              : "rgba(59, 130, 246, 0.08)",
          border: `1px solid ${
            item.status === "GAP"
              ? "rgba(239, 68, 68, 0.2)"
              : item.status === "PARTIAL"
              ? "rgba(245, 158, 11, 0.2)"
              : "rgba(59, 130, 246, 0.2)"
          }`,
          fontSize: "12.5px",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <Sparkles size={14} style={{ flexShrink: 0, marginTop: "2px", color: "var(--text-accent)" }} />
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Next Action: </strong>
          <span style={{ color: "var(--text-secondary)" }}>{item.suggestedAction}</span>
        </div>
      </div>
    </div>
  );
};
