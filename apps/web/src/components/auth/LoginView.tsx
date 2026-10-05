import React, { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Info,
  ShieldAlert,
} from "lucide-react";
import { loginUser, resendVerificationEmail } from "../../api/client.js";
import type { SafeUser } from "@skilltwin/contracts";

interface LoginViewProps {
  onNavigate: (screen: string) => void;
  onLoginSuccess: (user: SafeUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRequiresVerification(false);
    setResendStatus(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.user) {
        onLoginSuccess(result.user);
      }
    } catch (err: any) {
      if (err.requiresVerification) {
        setRequiresVerification(true);
        setError("Please verify your email before signing in.");
      } else {
        setError(err.message || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await resendVerificationEmail(email.trim().toLowerCase());
      setResendStatus(res.message || "Verification email sent.");
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8" data-testid="login-page">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-brand-blue font-bold text-sm mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
            <span>SkillTwin Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to access your developer career intelligence workspace.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 animate-fade-in" data-testid="auth-error-alert">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Unverified Email Warning Callout */}
        {requiresVerification && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 text-xs text-amber-900 animate-fade-in" data-testid="unverified-callout">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <ShieldAlert size={16} />
              <span>Email Verification Required</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Your account has been registered but not yet activated. Please check your inbox for the activation link.
            </p>
            {resendStatus && (
              <div className="p-2 bg-amber-100 rounded text-amber-950 font-medium">
                {resendStatus}
              </div>
            )}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              data-testid="resend-verification-login-btn"
            >
              {resending && <RefreshCw size={12} className="animate-spin" />}
              <span>Resend verification email</span>
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                data-testid="login-email-input"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password-input" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate("forgot_password")}
                className="text-xs font-medium text-brand-blue hover:underline"
                data-testid="forgot-password-link"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                data-testid="login-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            data-testid="login-submit-btn"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Don't have an account?{" "}
            <button
              onClick={() => onNavigate("signup")}
              className="text-brand-blue font-bold hover:underline"
              data-testid="switch-to-signup-btn"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
