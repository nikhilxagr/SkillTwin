import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { verifyEmailToken, resendVerificationEmail } from "../../api/client.js";

interface VerifyEmailViewProps {
  initialToken?: string;
  initialEmail?: string;
  onNavigate: (screen: string) => void;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({
  initialToken,
  initialEmail = "",
  onNavigate,
}) => {
  const [token, setToken] = useState<string>(initialToken || "");
  const [status, setStatus] = useState<"pending" | "loading" | "success" | "error">(
    initialToken ? "loading" : "pending"
  );
  const [message, setMessage] = useState<string>("");
  const [resendEmail, setResendEmail] = useState(initialEmail);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Parse token from window location hash or query if not passed via props
  useEffect(() => {
    let activeToken = initialToken;
    if (!activeToken && typeof window !== "undefined") {
      const hash = window.location.hash;
      const queryIndex = hash.indexOf("?");
      if (queryIndex !== -1) {
        const params = new URLSearchParams(hash.substring(queryIndex));
        activeToken = params.get("token") || "";
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        activeToken = searchParams.get("token") || "";
      }
    }

    if (activeToken) {
      setToken(activeToken);
      executeVerification(activeToken);
    } else {
      setStatus("pending");
    }
  }, [initialToken]);

  const executeVerification = async (verifyToken: string) => {
    setStatus("loading");
    setMessage("Verifying your email address...");
    try {
      const res = await verifyEmailToken(verifyToken);
      setStatus("success");
      setMessage(res.message || "Email verified successfully! Your account is activated.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Verification link is invalid or has expired.");
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await resendVerificationEmail(resendEmail.trim().toLowerCase());
      setResendStatus(res.message || "Verification email sent.");
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12" data-testid="verify-email-page">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        {status === "pending" && (
          <div className="space-y-4 animate-fade-in" data-testid="verify-pending-box">
            <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-full mx-auto flex items-center justify-center border border-blue-100">
              <Mail size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Check your email
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We've sent a verification link to your email address. Confirm your email address to activate your SkillTwin account.
            </p>

            <div className="pt-2 text-left">
              <p className="text-xs text-slate-600 mb-2">
                Need a new verification link? Enter your email:
              </p>
              <form onSubmit={handleResend} className="space-y-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                {resendStatus && (
                  <div className="text-[11px] text-blue-700 font-medium">
                    {resendStatus}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  data-testid="resend-verification-btn"
                >
                  {resending && <RefreshCw size={12} className="animate-spin" />}
                  <span>Resend verification email</span>
                </button>
              </form>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigate("login")}
                className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Back to sign in
              </button>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="py-8 space-y-4">
            <RefreshCw size={36} className="animate-spin text-brand-blue mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Activating your account...</h2>
            <p className="text-xs text-slate-500">Checking verification token validity</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-fade-in" data-testid="verify-success-box">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Email Verified!
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {message}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate("login")}
                className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                data-testid="verified-login-btn"
              >
                <span>Sign in to your account</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 animate-fade-in" data-testid="verify-error-box">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full mx-auto flex items-center justify-center border border-red-100">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Verification Failed
            </h2>
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-left font-medium">
              {message}
            </p>

            {/* Resend Form */}
            <div className="pt-2 text-left">
              <p className="text-xs text-slate-600 mb-2">
                Need a new verification link? Enter your email:
              </p>
              <form onSubmit={handleResend} className="space-y-2">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                {resendStatus && (
                  <div className="text-[11px] text-blue-700 font-medium">
                    {resendStatus}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {resending && <RefreshCw size={12} className="animate-spin" />}
                  <span>Send New Link</span>
                </button>
              </form>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate("login")}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
              >
                Back to Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
