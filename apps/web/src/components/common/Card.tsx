import React from "react";

interface CardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  action,
  icon,
  children,
  className = "",
  style,
}) => {
  return (
    <div className={`twin-panel ${className}`} style={style}>
      {(title || action) && (
        <div className="panel-header">
          <div>
            {title && (
              <h3 className="panel-title">
                {icon}
                {title}
              </h3>
            )}
            {description && <p className="panel-desc">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
