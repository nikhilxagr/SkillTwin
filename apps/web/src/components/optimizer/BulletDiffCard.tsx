import React, { useState } from "react";
import { Check, Copy, AlertTriangle, ShieldCheck, X, CheckCheck } from "lucide-react";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import type { BulletImprovement, OptimizationHighlightTag } from "@skilltwin/contracts";

interface BulletDiffCardProps {
  bullet: BulletImprovement;
  status?: "pending" | "accepted" | "rejected";
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const BulletDiffCard: React.FC<BulletDiffCardProps> = ({
  bullet,
  status = "pending",
  onAccept,
  onReject,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bullet.improvedBullet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTagVariant = (tag?: OptimizationHighlightTag | string) => {
    switch (tag) {
      case "MATCHED":
        return "match";
      case "MISSING":
        return "gap";
      case "WEAK_EVIDENCE":
        return "partial";
      case "RELEVANT":
      case "RECOMMENDED":
      default:
        return "primary";
    }
  };

  const getTagLabel = (tag?: OptimizationHighlightTag | string) => {
    if (tag === "WEAK_EVIDENCE") return "WEAK EVIDENCE";
    return tag || "RELEVANT";
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--bg-canvas)",
        borderRadius: "var(--radius-lg)",
        border: `1px solid ${
          status === "accepted"
            ? "var(--color-match-border)"
            : status === "rejected"
            ? "var(--border-subtle)"
            : "var(--border-subtle)"
        }`,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        opacity: status === "rejected" ? 0.65 : 1,
        transition: "all 0.15s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-deep-navy)" }}>
            Target Skill: {bullet.targetedSkill}
          </span>
          <Badge variant="match">
            <ShieldCheck size={12} /> Truth-Verified
          </Badge>
          <Badge variant={getTagVariant(bullet.highlightTag)}>
            {getTagLabel(bullet.highlightTag)}
          </Badge>
          {status === "accepted" && (
            <Badge variant="match">
              <CheckCheck size={11} /> ACCEPTED
            </Badge>
          )}
          {status === "rejected" && (
            <Badge variant="neutral">
              REJECTED
            </Badge>
          )}
          {bullet.sourceSection && (
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
              ({bullet.sourceSection})
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            variant="outline"
            size="sm"
            icon={copied ? <Check size={12} color="var(--color-match)" /> : <Copy size={12} />}
            onClick={handleCopy}
          >
            {copied ? "Copied" : "Copy"}
          </Button>

          {onAccept && (
            <button
              type="button"
              onClick={() => onAccept(bullet.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                cursor: "pointer",
                border: "1px solid var(--color-match)",
                background:
                  status === "accepted" ? "var(--color-match)" : "rgba(16, 185, 129, 0.08)",
                color: status === "accepted" ? "#ffffff" : "var(--color-match)",
                transition: "all 0.15s ease",
              }}
            >
              <Check size={12} />
              {status === "accepted" ? "Accepted" : "Accept"}
            </button>
          )}

          {onReject && (
            <button
              type="button"
              onClick={() => onReject(bullet.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                cursor: "pointer",
                border: "1px solid var(--border-subtle)",
                background:
                  status === "rejected" ? "var(--bg-subtle)" : "transparent",
                color: status === "rejected" ? "var(--text-muted)" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              <X size={12} />
              {status === "rejected" ? "Rejected" : "Reject"}
            </button>
          )}
        </div>
      </div>

      {/* Structured Current vs Recommended Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px",
        }}
      >
        {/* CURRENT */}
        <div
          style={{
            padding: "12px 14px",
            background: "var(--bg-subtle)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.03em",
            }}
          >
            📌 Current Phrasing (Under-demonstrates Context)
          </span>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            {bullet.originalBullet}
          </div>
        </div>

        {/* RECOMMENDED */}
        <div
          style={{
            padding: "12px 14px",
            background: "rgba(37, 99, 235, 0.04)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(37, 99, 235, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-primary-blue)",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.03em",
            }}
          >
            💡 Recommended • Enhanced Phrasing (Evidence-Grounded)
          </span>
          <div
            style={{
              fontSize: "13px",
              color: "var(--color-deep-navy)",
              fontWeight: 600,
              lineHeight: "1.5",
            }}
          >
            {bullet.improvedBullet}
          </div>
        </div>
      </div>

      {/* REASON */}
      <div
        style={{
          padding: "10px 14px",
          background: "var(--bg-subtle)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          fontSize: "12.5px",
          lineHeight: "1.5",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            fontWeight: 700,
            display: "block",
            marginBottom: "3px",
          }}
        >
          🧠 Reason
        </span>
        <span style={{ color: "var(--text-primary)" }}>{bullet.rationale}</span>
      </div>

      {/* Truth Warning if present */}
      {bullet.truthWarning && (
        <div
          style={{
            padding: "9px 12px",
            borderRadius: "var(--radius-md)",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            fontSize: "12px",
            color: "#92400e",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <AlertTriangle
            size={14}
            style={{ flexShrink: 0, marginTop: "2px", color: "var(--color-partial)" }}
          />
          <div>
            <strong>Truth-Check Constraint: </strong> {bullet.truthWarning}
          </div>
        </div>
      )}
    </div>
  );
};
