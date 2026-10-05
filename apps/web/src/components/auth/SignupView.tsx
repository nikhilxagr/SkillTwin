import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { signupUser, resendVerificationEmail } from "../../api/client.js";

interface SignupViewProps {
  onNavigate: (screen: string) => void;
  onSignupSuccess?: (email: string) => void;
}

export const SignupView: React.FC<SignupViewProps> = ({ onNavigate }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain both letters and numbers.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signupUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      });
      setVerificationSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
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
      setResendStatus(res.message || "Verification email resent.");
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  // Verification Pending Screen
  if (verificationSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12" data-testid="verification-pending-view">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center animate-fade-in">
          <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-full mx-auto flex items-center justify-center mb-5 border border-blue-100">
            <Mail size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Check your email
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Account created. We’ve sent a verification link to <strong className="text-slate-900">{email}</strong>.
            Confirm your email address to activate your SkillTwin account.
          </p>

          {resendStatus && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-medium">
              {resendStatus}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              data-testid="resend-verification-btn"
            >
              {resending && <RefreshCw size={15} className="animate-spin" />}
              <span>Resend verification email</span>
            </button>

            <button
              onClick={() => onNavigate("login")}
              className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              data-testid="go-to-login-btn"
            >
              Back to Sign In
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Secure cryptographically verified email activation</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8" data-testid="signup-page">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-brand-blue font-bold text-sm mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
            <span>SkillTwin Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create your developer profile.
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quantify your actual engineering skills with verifiable evidence.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 animate-fade-in" data-testid="auth-error-alert">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                id="signup-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                required
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                data-testid="signup-name-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                id="signup-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                data-testid="signup-email-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                id="signup-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters with letters & numbers"
                required
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                data-testid="signup-password-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-confirm-password-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                id="signup-confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                data-testid="signup-confirm-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            data-testid="signup-submit-btn"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{" "}
            <button
              onClick={() => onNavigate("login")}
              className="text-brand-blue font-bold hover:underline"
              data-testid="switch-to-login-btn"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
