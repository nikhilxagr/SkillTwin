import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldAlert, Target } from "lucide-react";
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
        padding: "16px 18px",
        background: "var(--bg-canvas)",
        borderRadius: "var(--radius-lg)",
        border: `1px solid ${
          item.status === "GAP"
            ? "var(--color-gap-border)"
            : item.status === "MATCH"
            ? "var(--color-match-border)"
            : "var(--border-subtle)"
        }`,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Top Line */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
              {item.canonicalName}
            </span>
            <Badge variant="neutral">{item.category}</Badge>
            <Badge variant={item.importance === "Required" ? "gap" : "optional"}>
              {item.importance}
            </Badge>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Candidate Confidence:{" "}
            <strong style={{ color: "var(--text-primary)" }}>{item.candidateConfidence}%</strong> (
            {item.evidenceCount} corroborating source{item.evidenceCount === 1 ? "" : "s"})
          </p>
        </div>

        <Badge variant={badgeVariant}>{getStatusLabel(item.status)}</Badge>
      </div>

      {/* Comparison Level Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 12px",
          background: "var(--bg-subtle)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          fontSize: "12.5px",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Demonstrated Level
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
            {item.candidateProficiency === "Not Detected" ? "Not Demonstrated" : item.candidateProficiency}
          </div>
        </div>

        <ArrowRight size={13} style={{ color: "var(--text-muted)" }} />

        <div>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Job Required Level
          </span>
          <div style={{ fontWeight: 700, color: "var(--color-primary-blue)" }}>{item.requiredProficiency}</div>
        </div>
      </div>

      {/* Evidence & Why it is a Gap */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px", lineHeight: "1.45" }}>
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Current Evidence: </strong>
          <span style={{ color: "var(--text-secondary)" }}>{item.evidenceSummary}</span>
        </div>

        {item.gapRationale && (
          <div style={{ padding: "6px 10px", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Why it is a gap: </strong>
            <span style={{ color: "var(--text-secondary)" }}>{item.gapRationale}</span>
          </div>
        )}
      </div>

      {/* Next Action Advice Box */}
      <div
        style={{
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          background:
            item.status === "GAP"
              ? "var(--color-gap-bg)"
              : item.status === "PARTIAL"
              ? "var(--color-partial-bg)"
              : "var(--color-light-blue)",
          border: `1px solid ${
            item.status === "GAP"
              ? "var(--color-gap-border)"
              : item.status === "PARTIAL"
              ? "var(--color-partial-border)"
              : "#bfdbfe"
          }`,
          fontSize: "12px",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <Target size={13} style={{ flexShrink: 0, marginTop: "2px", color: "var(--color-primary-blue)" }} />
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Next Action: </strong>
          <span style={{ color: "var(--text-secondary)" }}>{item.suggestedAction}</span>
        </div>
      </div>
    </div>
  );
};
