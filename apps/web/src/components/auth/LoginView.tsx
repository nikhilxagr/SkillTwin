import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  ClipboardCopy,
} from "lucide-react";
import { loginUser, verifyEmailOtp, resendEmailOtp } from "../../api/client.js";
import { SocialAuthButtons } from "./SocialAuthButtons.js";
import type { SafeUser } from "@skilltwin/contracts";

interface LoginViewProps {
  onNavigate: (screen: string) => void;
  onLoginSuccess: (user: SafeUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const handlePasteOtp = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        const clean = text.replace(/\D/g, "").slice(0, 6);
        if (clean) {
          setOtp(clean);
          setCopiedNotice("Pasted!");
          setTimeout(() => setCopiedNotice(null), 2500);
          return;
        }
      }
    } catch {
      // Browser restriction
    }
    setCopiedNotice("Use Ctrl+V or long-press to paste");
    setTimeout(() => setCopiedNotice(null), 2500);
  };

  // Cooldown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Check URL query and hash for OAuth error redirects
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashQuery = window.location.hash.includes("?")
        ? window.location.hash.split("?")[1]
        : "";
      const hashParams = new URLSearchParams(hashQuery);

      const oauthErr = searchParams.get("oauth_error") || hashParams.get("oauth_error");
      if (oauthErr) {
        setError(decodeURIComponent(oauthErr));
      }
    } catch {
      // Ignore URL parse error
    }
  }, []);

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
        setCountdown(60);
        setResendStatus("A 6-digit verification code has been dispatched to your email.");
      } else {
        setError(err.message || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim().replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const result = await verifyEmailOtp(email.trim().toLowerCase(), cleanOtp);
      if (result.user) {
        onLoginSuccess(result.user);
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code. Please check your email.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email.trim()) return;
    setResending(true);
    setError(null);
    setResendStatus(null);

    try {
      const res = await resendEmailOtp(email.trim().toLowerCase());
      setResendStatus(res.message || "A new 6-digit verification code has been sent.");
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // If account is unverified, show OTP verification prompt directly
  if (requiresVerification) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8" data-testid="login-otp-view">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-sm text-center animate-fade-in">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full mx-auto flex items-center justify-center mb-5 border border-amber-100">
            <KeyRound size={28} />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Verify Email to Sign In
          </h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Your account is not verified yet. We have sent a 6-digit verification code to{" "}
            <strong className="text-slate-900">{email}</strong>.
          </p>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 text-left animate-fade-in">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          {resendStatus && !error && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{resendStatus}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-otp-input" className="block text-xs font-semibold text-slate-700">
                  Enter 6-Digit Code
                </label>
                <button
                  type="button"
                  onClick={handlePasteOtp}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-blue hover:text-brand-blue-hover bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
                  title="Paste OTP from clipboard (Mobile & Web)"
                >
                  <ClipboardCopy size={12} />
                  <span>{copiedNotice || "Paste Code"}</span>
                </button>
              </div>
              <input
                id="login-otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(val);
                }}
                placeholder="••••••"
                autoFocus
                required
                className="w-full py-3.5 px-4 text-center text-3xl font-mono font-bold tracking-[0.4em] bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:bg-white transition-all"
                data-testid="login-otp-input"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span>Code expires in 10 minutes</span>
                <span className="text-slate-500 font-medium">1-tap copy &amp; paste</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={verifyingOtp || otp.length !== 6}
              className="w-full py-3 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="verify-login-otp-btn"
            >
              {verifyingOtp ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP & Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <button
              type="button"
              onClick={() => {
                setRequiresVerification(false);
                setError(null);
                setOtp("");
              }}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft size={13} />
              <span>Back to sign in</span>
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="text-brand-blue font-bold hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1.5"
            >
              {resending && <RefreshCw size={12} className="animate-spin" />}
              <span>
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8" data-testid="login-page">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-sm">
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

        {/* Social Authentication Buttons */}
        <SocialAuthButtons mode="login" disabled={loading} />

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full !pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
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
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full !pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
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
