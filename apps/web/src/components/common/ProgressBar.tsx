import React from "react";

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string;
  showLabel?: boolean;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color,
  showLabel = false,
  height = 6,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  // Determine automatic color if none passed
  const autoColor =
    clamped >= 80 ? "#10b981" : clamped >= 50 ? "#3b82f6" : clamped >= 30 ? "#f59e0b" : "#ef4444";

  const fillColor = color || autoColor;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
      <div className="progress-track" style={{ height: `${height}px`, flex: 1 }}>
        <div
          className="progress-fill"
          style={{
            width: `${clamped}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
      {showLabel && (
        <span
          className="font-mono"
          style={{ fontSize: "11.5px", color: "var(--text-secondary)", minWidth: "32px" }}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
};
