import React, { useState } from "react";
import { Mail, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "../../api/client.js";

interface ForgotPasswordViewProps {
  onNavigate: (screen: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
      setMessage(res.message || "If an account exists for this email, a password reset link has been sent.");
    } catch (err: any) {
      setError(err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8" data-testid="forgot-password-page">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-brand-blue font-bold text-sm mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
            <span>SkillTwin Account Recovery</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reset your password
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your account email to receive a secure password reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 font-medium">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-full mx-auto flex items-center justify-center border border-blue-100">
              <Mail size={24} />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/60 border border-blue-100 rounded-lg p-3">
              {message}
            </p>
            <button
              onClick={() => onNavigate("login")}
              className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Back to Sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="forgot-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full !pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send password reset link</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
