import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Analyzing career intelligence...",
  subtext = "Extracting evidence, comparing taxonomy, and computing gaps.",
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-accent)",
          marginBottom: "18px",
        }}
      >
        <Loader2 className="animate-spin" size={24} />
      </div>
      <h4
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: "6px",
        }}
      >
        {message}
      </h4>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "380px" }}>{subtext}</p>
    </div>
  );
};
