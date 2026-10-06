import React, { useState } from "react";
import {
  CheckCircle2,
  RefreshCw,
  Layers,
  Menu,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../common/Button.js";
import type { SafeUser } from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface HeaderProps {
  activeRole: string;
  hasResume: boolean;
  hasJob: boolean;
  onReset?: () => void;
  onToggleMobileMenu?: () => void;
  currentUser?: SafeUser | null;
  onLogout?: () => void;
  onNavigate?: (screen: ActiveScreen) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  hasResume,
  hasJob,
  onReset,
  onToggleMobileMenu,
  currentUser,
  onLogout,
  onNavigate,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = (currentUser?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="top-bar">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded border border-border-subtle text-content-primary hover:bg-surface-subtle"
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
        )}

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
            {hasResume ? "Evidence Active" : "No Resume"}
          </span>
        </div>

        <div style={{ height: "16px", width: "1px", background: "var(--border-subtle)" }} className="hidden sm:block" />

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="hidden sm:flex">
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
        {onReset && (
          <Button variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={onReset}>
            Reset
          </Button>
        )}

        {/* User Account / Auth Section */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg border border-border-subtle hover:bg-surface-subtle transition-colors text-left"
              data-testid="user-menu-btn"
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 text-brand-blue font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
              <span className="text-xs font-semibold text-content-primary max-w-[120px] truncate hidden sm:inline">
                {currentUser.name}
              </span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white border border-border-subtle rounded-xl shadow-lg p-2 z-50 text-xs animate-fade-in"
                data-testid="user-dropdown-menu"
              >
                <div className="px-3 py-2 border-b border-border-subtle mb-1">
                  <div className="font-semibold text-content-primary truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-content-secondary truncate">{currentUser.email}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                    <ShieldCheck size={11} />
                    <span>Verified Account</span>
                  </div>
                </div>

                {onNavigate && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate("profile");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-subtle text-content-primary font-medium flex items-center gap-2"
                    data-testid="menu-profile-btn"
                  >
                    <User size={14} className="text-slate-500" />
                    <span>Developer Profile</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 font-medium flex items-center gap-2"
                    data-testid="menu-logout-btn"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          onNavigate && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("login")}
                data-testid="header-login-btn"
              >
                Sign In
              </Button>
            </div>
          )
        )}
      </div>
    </header>
  );
};
