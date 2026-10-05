import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Briefcase,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Save,
  X,
  FileText,
  BarChart2,
  RefreshCw,
} from "lucide-react";
import type { SafeUser, UpdateProfileRequest } from "@skilltwin/contracts";
import { updateUserProfile, getUserProfile } from "../../api/client.js";

interface ProfileViewProps {
  currentUser: SafeUser | null;
  onUpdateUser: (user: SafeUser) => void;
  onNavigate: (screen: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateUser,
  onNavigate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || "");
  const [targetRole, setTargetRole] = useState(currentUser?.profile?.targetRole || "Full Stack Developer");
  const [headline, setHeadline] = useState(currentUser?.profile?.headline || "");
  const [bio, setBio] = useState(currentUser?.profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setTargetRole(currentUser.profile?.targetRole || "Full Stack Developer");
      setHeadline(currentUser.profile?.headline || "");
      setBio(currentUser.profile?.bio || "");
    }
  }, [currentUser]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updates: UpdateProfileRequest = {
        name: name.trim(),
        targetRole: targetRole.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
      };
      const updated = await updateUserProfile(updates);
      onUpdateUser(updated);
      setIsEditing(false);
      setMessage({ text: "Profile updated successfully.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update profile.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) {
      setName(currentUser.name);
      setTargetRole(currentUser.profile?.targetRole || "Full Stack Developer");
      setHeadline(currentUser.profile?.headline || "");
      setBio(currentUser.profile?.bio || "");
    }
    setIsEditing(false);
    setMessage(null);
  };

  const initials = (name || currentUser?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in" data-testid="profile-page">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-blue font-bold text-2xl shadow-inner shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="profile-name">
                  {name || "Developer Profile"}
                </h1>
                {currentUser?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" data-testid="verified-badge">
                    <CheckCircle2 size={13} />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle size={13} />
                    <span>Unverified</span>
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1" data-testid="profile-target-role">
                {targetRole}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5" data-testid="profile-email">
                <Mail size={13} />
                <span>{currentUser?.email || "user@example.com"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                data-testid="edit-profile-btn"
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  data-testid="save-profile-btn"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Details Form / Display */}
        <div className="mt-6 space-y-5">
          {isEditing ? (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="profile-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    data-testid="profile-edit-name-input"
                  />
                </div>
                <div>
                  <label htmlFor="profile-role-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Engineering Role
                  </label>
                  <input
                    id="profile-role-input"
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    data-testid="profile-edit-role-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-headline-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Headline
                </label>
                <input
                  id="profile-headline-input"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. BCA Student | Full Stack Developer | React & Node.js"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  data-testid="profile-edit-headline-input"
                />
              </div>

              <div>
                <label htmlFor="profile-bio-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Biography
                </label>
                <textarea
                  id="profile-bio-input"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a concise overview of your technical background, core focus areas, and career goals."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
                  data-testid="profile-edit-bio-input"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Professional Headline
                </div>
                <p className="text-sm text-slate-800 font-medium" data-testid="profile-headline-display">
                  {headline || "No headline provided yet."}
                </p>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Bio
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl" data-testid="profile-bio-display">
                  {bio || "Add a short bio describing your core competencies, systems background, and engineering interests."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Security & Fast Workspace Jumps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Security Overview Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-sm">
            <ShieldCheck size={18} className="text-brand-blue" />
            <span>Account Security & Verification</span>
          </div>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span>Email Verification</span>
              <span className="font-semibold text-emerald-700">
                {currentUser?.emailVerified ? "Verified (Active)" : "Pending Verification"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span>Session Type</span>
              <span className="font-semibold text-slate-800">HTTP-Only Secure Cookie</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span>Account Isolation</span>
              <span className="font-semibold text-slate-800">Private User Workspace</span>
            </div>
          </div>
        </div>

        {/* Quick Workspace Navigation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-slate-900 font-bold text-sm mb-3">
            Quick Actions
          </div>
          <div className="space-y-2">
            <button
              onClick={() => onNavigate("resume_upload")}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-xs font-semibold text-slate-800 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <FileText size={15} className="text-brand-blue" />
                <span>Upload / Update Master Resume</span>
              </span>
              <span className="text-slate-400">→</span>
            </button>

            <button
              onClick={() => onNavigate("skill_matrix")}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-xs font-semibold text-slate-800 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <BarChart2 size={15} className="text-emerald-600" />
                <span>View Verified Skill Matrix</span>
              </span>
              <span className="text-slate-400">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
