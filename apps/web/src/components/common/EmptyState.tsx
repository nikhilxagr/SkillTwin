import React from "react";
import { Button } from "./Button.js";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "54px 24px",
        background: "var(--bg-surface)",
        border: "1px dashed var(--border-strong)",
        borderRadius: "12px",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "12px",
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-accent)",
          marginBottom: "16px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "6px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "13.5px",
          color: "var(--text-secondary)",
          maxWidth: "420px",
          lineHeight: "1.6",
          marginBottom: "20px",
        }}
      >
        {description}
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        {actionText && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
};
