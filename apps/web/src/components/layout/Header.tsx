import React from "react";
import { CheckCircle2, RefreshCw, Layers } from "lucide-react";
import { Button } from "../common/Button.js";

interface HeaderProps {
  activeRole: string;
  hasResume: boolean;
  hasJob: boolean;
  onLoadSample: () => void;
  onReset: () => void;
  isSampleLoaded: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  hasResume,
  hasJob,
  onLoadSample,
  onReset,
  isSampleLoaded,
}) => {
  return (
    <header className="top-bar">
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: hasResume ? "var(--color-match)" : "var(--color-partial)",
            }}
          />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
            {hasResume ? "Evidence Active" : "No Resume Uploaded"}
          </span>
        </div>

        <div style={{ height: "16px", width: "1px", background: "var(--border-subtle)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Target Role:</span>
          <span
            style={{
              fontSize: "12.5px",
              color: "var(--text-primary)",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
            }}
          >
            {activeRole}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Button
          variant={isSampleLoaded ? "secondary" : "primary"}
          size="sm"
          icon={<Layers size={13} />}
          onClick={onLoadSample}
        >
          {isSampleLoaded ? "Sample Profile Active" : "Load Full Sample Profile"}
        </Button>
        <Button variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={onReset}>
          Reset
        </Button>
      </div>
    </header>
  );
};
