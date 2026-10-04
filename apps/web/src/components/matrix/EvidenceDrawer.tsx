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
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-strong)",
        boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.6)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "28px 24px",
      }}
    >
      {/* Drawer Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
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
          <h2 style={{ fontSize: "24px", fontWeight: 800 }}>{skill.canonicalName}</h2>
          {skill.aliases.length > 0 && (
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Aliases: {skill.aliases.join(", ")}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "6px",
            color: "var(--text-secondary)",
            padding: "6px",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Confidence Score Panel */}
      <div
        style={{
          padding: "16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Confidence Assessment
          </span>
          <span className="font-mono" style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-accent)" }}>
            {skill.confidence}%
          </span>
        </div>
        <ProgressBar value={skill.confidence} />
        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "8px" }}>
          Proficiency Grade: <strong style={{ color: "var(--text-primary)" }}>{skill.proficiency}</strong>
        </p>
      </div>

      {/* Rationale Explanation */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
          Assessment Rationale
        </h4>
        <p style={{ fontSize: "13.5px", color: "var(--text-primary)", lineHeight: "1.6" }}>
          {skill.explanation}
        </p>
      </div>

      {/* Corroborating Evidence Chain */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>
          Corroborating Evidence ({skill.evidence.length})
        </h4>

        {skill.evidence.length === 0 ? (
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "6px", fontSize: "12.5px", color: "var(--text-muted)" }}>
            No project or commercial evidence found. Skill is currently claimed without implementation backing.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {skill.evidence.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: "12px",
                  background: "var(--bg-elevated)",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-match)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={13} /> {ev.sourceType.replace("_", " ").toUpperCase()}
                  </span>
                  {ev.sourceTitle && (
                    <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {ev.sourceTitle}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  "{ev.context}"
                </p>
                <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                  Evidence weight: +{ev.weight} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missing Evidence Checklist */}
      <div style={{ marginBottom: "24px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>
          Missing Evidence Checklist
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {skill.missingEvidence.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "rgba(245, 158, 11, 0.06)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "6px",
                fontSize: "12.5px",
                color: "#fde68a",
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Related Ecosystem Skills */}
      {skill.relatedSkills.length > 0 && (
        <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
            Detected Ecosystem Neighbors
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
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
