import React from "react";
import { Sidebar } from "./Sidebar.js";
import { Header } from "./Header.js";
import type { ActiveScreen } from "../../types/navigation.js";

interface ShellProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  activeRole: string;
  hasResume: boolean;
  hasJob: boolean;
  onLoadSample: () => void;
  onReset: () => void;
  isSampleLoaded: boolean;
  skillCount: number;
  criticalGapCount: number;
  candidateName: string;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentScreen,
  onNavigate,
  activeRole,
  hasResume,
  hasJob,
  onLoadSample,
  onReset,
  isSampleLoaded,
  skillCount,
  criticalGapCount,
  candidateName,
  children,
}) => {
  return (
    <div className="app-shell">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        skillCount={skillCount}
        criticalGapCount={criticalGapCount}
        candidateName={candidateName}
      />
      <div className="main-wrapper">
        <Header
          activeRole={activeRole}
          hasResume={hasResume}
          hasJob={hasJob}
          onLoadSample={onLoadSample}
          onReset={onReset}
          isSampleLoaded={isSampleLoaded}
        />
        <main className="content-container">{children}</main>
      </div>
    </div>
  );
};
