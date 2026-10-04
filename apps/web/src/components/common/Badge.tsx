import React from "react";

export type BadgeVariant =
  | "match"
  | "gap"
  | "partial"
  | "weak"
  | "optional"
  | "neutral"
  | "primary";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  icon,
  className = "",
  style,
}) => {
  const variantClass = `badge-${variant}`;
  return (
    <span className={`badge ${variantClass} ${className}`} style={style}>
      {icon && <span style={{ display: "inline-flex", fontSize: "11px" }}>{icon}</span>}
      {children}
    </span>
  );
};
