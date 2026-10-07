import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Mail,
  KeyRound,
  ClipboardCopy,
} from "lucide-react";
import { verifyEmailOtp, resendEmailOtp, verifyEmailToken } from "../../api/client.js";

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
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [message, setMessage] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Check if token or OTP was passed via URL hash or query params
  useEffect(() => {
    let activeToken = initialToken;
    let activeEmail = initialEmail;
    let activeOtp = "";
    let autoVerify = false;

    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const queryIndex = hash.indexOf("?");
      if (queryIndex !== -1) {
        const params = new URLSearchParams(hash.substring(queryIndex));
        if (!activeToken) activeToken = params.get("token") || "";
        if (!activeEmail) activeEmail = params.get("email") || "";
        activeOtp = params.get("otp") || "";
        autoVerify = params.get("auto") === "true";
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        if (!activeToken) activeToken = searchParams.get("token") || "";
        if (!activeEmail) activeEmail = searchParams.get("email") || "";
        activeOtp = searchParams.get("otp") || "";
        autoVerify = searchParams.get("auto") === "true";
      }
    }

    if (activeEmail) {
      setEmail(decodeURIComponent(activeEmail));
    }

    if (activeOtp) {
      setOtp(activeOtp);
    }

    // Direct 1-click verification from email link
    if (activeEmail && activeOtp && (autoVerify || activeOtp.length === 6)) {
      executeOtpAutoVerification(decodeURIComponent(activeEmail), activeOtp);
    } else if (activeToken) {
      executeTokenVerification(activeToken);
    }
  }, [initialToken, initialEmail]);

  const executeOtpAutoVerification = async (targetEmail: string, targetOtp: string) => {
    setStatus("loading");
    setMessage("Verifying email via 1-click OTP code...");
    try {
      const res = await verifyEmailOtp(targetEmail.trim().toLowerCase(), targetOtp.trim());
      setStatus("success");
      setMessage(res.message || "Email verified successfully! Welcome to SkillTwin.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Invalid or expired verification code. Please enter the 6-digit code manually.");
    }
  };

  const handlePasteClipboard = async () => {
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
      // Browser permission prompt or restriction
    }
    setCopiedNotice("Use Ctrl+V or long-press to paste");
    setTimeout(() => setCopiedNotice(null), 2500);
  };

  const executeTokenVerification = async (verifyToken: string) => {
    setStatus("loading");
    setMessage("Verifying email address...");
    try {
      const res = await verifyEmailToken(verifyToken);
      setStatus("success");
      setMessage(res.message || "Email verified successfully! Your account is activated.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Verification link is invalid or has expired. Please verify using your 6-digit OTP.");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    const cleanOtp = otp.trim().replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setMessage("Please enter the complete 6-digit verification code.");
      setStatus("error");
      return;
    }

    setVerifying(true);
    setStatus("loading");
    setMessage("Verifying your code...");

    try {
      const res = await verifyEmailOtp(email.trim().toLowerCase(), cleanOtp);
      setStatus("success");
      setMessage(res.message || "Email verified successfully! You are now logged in.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Invalid or expired verification code. Please check your email.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email.trim()) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await resendEmailOtp(email.trim().toLowerCase());
      setResendStatus(res.message || "A new 6-digit verification code has been dispatched.");
      setCountdown(60);
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12" data-testid="verify-email-page">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        {/* Loading State */}
        {status === "loading" && (
          <div className="py-8 space-y-4 animate-fade-in">
            <RefreshCw size={36} className="animate-spin text-brand-blue mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Activating your account...</h2>
            <p className="text-xs text-slate-500">{message}</p>
          </div>
        )}

        {/* Success State */}
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
                <span>Continue to Sign In</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* OTP Input Form & Error Recovery */}
        {(status === "form" || status === "error") && (
          <div className="space-y-5 animate-fade-in">
            <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-full mx-auto flex items-center justify-center border border-blue-100">
              <KeyRound size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Verify Your Account
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Check your email for the 6-digit OTP verification code sent via Nodemailer.
              </p>
            </div>

            {status === "error" && message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700 text-left animate-fade-in">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{message}</span>
              </div>
            )}

            {resendStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-medium">
                {resendStatus}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-blue hover:text-brand-blue-hover bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                    title="Paste OTP from clipboard (Mobile & Web)"
                  >
                    <ClipboardCopy size={11} />
                    <span>{copiedNotice || "Paste Code"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  required
                  className="w-full py-3 px-4 text-center text-2xl font-mono font-bold tracking-[0.4em] bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:bg-white"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Code expires in 10 minutes</span>
                  <span className="text-slate-500 font-medium">1-tap copy &amp; paste</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || otp.length !== 6 || !email.trim()}
                className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code & Activate</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || countdown > 0 || !email.trim()}
                className="text-brand-blue font-bold hover:underline disabled:opacity-50"
                data-testid="resend-verification-btn"
              >
                {resending && <RefreshCw size={12} className="inline animate-spin mr-1" />}
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend 6-digit code"}
              </button>

              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                Back to Sign in
              </button>
            </div>

            <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Nodemailer secure email delivery</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
