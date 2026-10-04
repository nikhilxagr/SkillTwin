import React, { useState } from "react";
import { Check, Copy, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import type { BulletImprovement } from "@skilltwin/contracts";

interface BulletDiffCardProps {
  bullet: BulletImprovement;
}

export const BulletDiffCard: React.FC<BulletDiffCardProps> = ({ bullet }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bullet.improvedBullet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--bg-elevated)",
        borderRadius: "10px",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
            Target Skill: {bullet.targetedSkill}
          </span>
          <Badge variant="match">
            <ShieldCheck size={12} /> Truth-Verified
          </Badge>
          <Badge variant="info">
            {bullet.highlightTag || "RECOMMENDED"}
          </Badge>
          {bullet.sourceSection && (
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
              ({bullet.sourceSection})
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={copied ? <Check size={12} color="var(--color-match)" /> : <Copy size={12} />}
          onClick={handleCopy}
        >
          {copied ? "Copied" : "Copy Improved"}
        </Button>
      </div>

      {/* Before / After Diff */}
      <div className="diff-container">
        <div>
          <span style={{ fontSize: "10.5px", color: "var(--color-gap)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
            Current Phrasing (Under-demonstrates Context)
          </span>
          <div className="diff-original">{bullet.originalBullet}</div>
        </div>

        <div>
          <span style={{ fontSize: "10.5px", color: "var(--color-match)", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "4px" }}>
            Enhanced Phrasing (Evidence-Grounded)
          </span>
          <div className="diff-improved">{bullet.improvedBullet}</div>
        </div>
      </div>

      {/* Rationale */}
      <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
        <strong style={{ color: "var(--text-primary)" }}>Engineering Rationale: </strong>
        {bullet.rationale}
      </p>

      {/* Truth Warning if present */}
      {bullet.truthWarning && (
        <div className="diff-warning">
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>
            <strong>Truth-Check Constraint: </strong> {bullet.truthWarning}
          </span>
        </div>
      )}
    </div>
  );
};
