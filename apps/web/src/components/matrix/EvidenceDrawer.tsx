import React from "react";
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Layers, FileCode } from "lucide-react";
import { Badge } from "../common/Badge.js";
import { ProgressBar } from "../common/ProgressBar.js";
import { Button } from "../common/Button.js";
import type { SkillMatrixItem } from "@skilltwin/contracts";

interface EvidenceDrawerProps {
  skill: SkillMatrixItem | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ skill, onClose }) => {
  if (!skill) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "min(520px, 100vw)",
        background: "var(--bg-canvas)",
        borderLeft: "1px solid var(--border-subtle)",
        boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.08)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "24px 20px",
      }}
    >
      {/* Drawer Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Badge variant="neutral">{skill.category}</Badge>
            <Badge
              variant={
                skill.evidenceLevel === "Demonstrated"
                  ? "match"
                  : skill.evidenceLevel === "WeakEvidence"
                  ? "weak"
                  : "partial"
              }
            >
              {skill.evidenceLevel === "Demonstrated"
                ? "Strong Evidence (Demonstrated)"
                : skill.evidenceLevel === "WeakEvidence"
                ? "Weak Evidence"
                : "Claimed Only"}
            </Badge>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-deep-navy)" }}>{skill.canonicalName}</h2>
          {skill.aliases.length > 0 && (
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Aliases: {skill.aliases.join(", ")}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            padding: "5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Confidence Score Panel */}
      <div
        style={{
          padding: "14px",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
            Confidence Assessment
          </span>
          <span className="font-mono" style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-primary-blue)" }}>
            {skill.confidence}%
          </span>
        </div>
        <ProgressBar value={skill.confidence} />
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
          Proficiency Grade: <strong style={{ color: "var(--text-primary)" }}>{skill.proficiency}</strong>
        </p>
      </div>

      {/* Rationale Explanation */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
          Assessment Rationale
        </h4>
        <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.55" }}>
          {skill.explanation}
        </p>
      </div>

      {/* Corroborating Evidence Chain */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
          Corroborating Evidence ({skill.evidence.length})
        </h4>

        {skill.evidence.length === 0 ? (
          <div style={{ padding: "12px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "12.5px", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
            No project or commercial evidence found. Skill is currently claimed without implementation backing.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {skill.evidence.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: "10px 12px",
                  background: "var(--bg-subtle)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--color-match)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={12} /> {ev.sourceType.replace("_", " ").toUpperCase()}
                  </span>
                  {ev.sourceTitle && (
                    <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      {ev.sourceTitle}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--text-primary)", lineHeight: "1.45" }}>
                  "{ev.context}"
                </p>
                <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "3px", textAlign: "right" }}>
                  Evidence weight: +{ev.weight} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missing Evidence Checklist */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
          Missing Evidence Checklist
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {skill.missingEvidence.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "var(--color-weak-bg)",
                border: "1px solid var(--color-weak-border)",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
                color: "#92400e",
              }}
            >
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Related Ecosystem Skills */}
      {skill.relatedSkills.length > 0 && (
        <div style={{ marginTop: "auto", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
          <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
            Detected Ecosystem Neighbors
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {skill.relatedSkills.map((rel) => (
              <Badge key={rel} variant="neutral">
                {rel}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
