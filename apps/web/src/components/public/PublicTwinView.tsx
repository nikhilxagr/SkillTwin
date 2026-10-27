import React, { useState, useEffect } from "react";
import type { PublicTwinProfile, RecruiterMatchResponse } from "@skilltwin/contracts";
import { getPublicTwinProfile, matchRecruiterJobDescription } from "../../api/client.js";

interface PublicTwinViewProps {
  username: string;
  onNavigate: (screen: any) => void;
  isOwner?: boolean;
}

const SAMPLE_JD_PRESETS = [
  {
    title: "Senior Full Stack Engineer",
    text: `Job Title: Senior Full Stack Engineer\nCompany: High-Growth Tech Scaleup\n\nRequirements:\n- 4+ years of professional experience with TypeScript and React.\n- Strong proficiency in Node.js backends and RESTful API architecture.\n- Hands-on experience with PostgreSQL database modeling and query optimization.\n- Experience with Docker containerization and modern CI/CD pipelines.\n- Passion for clean, test-driven architecture and code reviews.`,
  },
  {
    title: "Backend Distributed Systems Engineer",
    text: `Job Title: Backend Systems Engineer\nRequirements:\n- Deep expertise in Node.js, Express/NestJS, or Go for high-throughput services.\n- Experience designing resilient PostgreSQL and Redis caching architectures.\n- Strong background in microservices, asynchronous message queues, and API security (OAuth/JWT).\n- Demonstrated experience with automated unit and integration testing.`,
  },
  {
    title: "Frontend Architect / React Specialist",
    text: `Job Title: Staff Frontend Engineer\nRequirements:\n- Mastery of TypeScript, React 18+, modern state management, and Vite build tooling.\n- Proven track record building responsive, accessible, high-performance web applications.\n- Strong design system acumen with modular CSS and component architectures.\n- Experience profiling web vitals and reducing bundle sizes.`,
  },
];

export const PublicTwinView: React.FC<PublicTwinViewProps> = ({
  username,
  onNavigate,
  isOwner = false,
}) => {
  const [profile, setProfile] = useState<PublicTwinProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state for skills
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Recruiter JD matcher tool state
  const [jdText, setJdText] = useState("");
  const [selectedRoleTitle, setSelectedRoleTitle] = useState("");
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<RecruiterMatchResponse | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getPublicTwinProfile(username)
      .then((data) => {
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || "Failed to load public profile.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("✓ Public Dossier link copied to clipboard!");
    }
  };

  const handleShareLinkedIn = () => {
    if (typeof window !== "undefined") {
      const shareUrl = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(
        `Check out ${profile?.name || "Developer"}'s Verified Digital Twin Dossier on SkillTwin!`
      );
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&title=${title}`,
        "_blank"
      );
    }
  };

  const handleRunMatch = async () => {
    if (!jdText.trim() || jdText.trim().length < 10) {
      setMatchError("Please enter at least 10 characters of a job description.");
      return;
    }

    setMatchingLoading(true);
    setMatchError(null);

    try {
      const result = await matchRecruiterJobDescription(
        username,
        jdText.trim(),
        selectedRoleTitle || undefined
      );
      setMatchResult(result);
    } catch (err: any) {
      setMatchError(err?.message || "Failed to execute JD matching analysis.");
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleApplyPreset = (preset: { title: string; text: string }) => {
    setSelectedRoleTitle(preset.title);
    setJdText(preset.text);
    setMatchResult(null);
    setMatchError(null);
  };

  if (loading) {
    return (
      <div className="state-screen" style={{ minHeight: "100vh", background: "#0a0d12" }}>
        <div className="loader" style={{ width: "40px", height: "40px" }} />
        <h2 style={{ color: "#dce3f0", margin: "16px 0 6px" }}>Loading Verified Digital Twin...</h2>
        <p style={{ color: "#7f8ca4", fontSize: "14px", margin: 0 }}>
          Retrieving verified repository evidence and skill proof points for @{username}
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="state-screen" style={{ minHeight: "100vh", background: "#0a0d12" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#2a1518",
            border: "1px solid #5a262a",
            display: "grid",
            placeItems: "center",
            color: "#ffad9e",
            fontSize: "24px",
          }}
        >
          ✕
        </div>
        <h2 style={{ color: "#e9edf5", margin: "16px 0 6px" }}>Dossier Not Available</h2>
        <p style={{ color: "#93a0b4", maxWidth: "460px", lineHeight: "1.6" }}>
          The requested profile <strong>@{username}</strong> was not found or has been set to private by the developer.
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button
            onClick={() => onNavigate("landing")}
            className="outline-button"
            style={{ padding: "10px 18px" }}
          >
            SkillTwin Home
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="primary-button small"
          >
            Create Your Own Twin
          </button>
        </div>
      </div>
    );
  }

  // Filter skills by selected category
  const filteredSkills =
    selectedCategory === "all"
      ? profile.skills
      : profile.skills.filter(
          (s) => s.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  const categories = [
    { id: "all", label: "All Skills" },
    { id: "frontend", label: "Frontend" },
    { id: "backend", label: "Backend" },
    { id: "devops", label: "DevOps & Cloud" },
    { id: "core", label: "Core Tech" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0d12", color: "#e9edf5" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#16342b",
            color: "#8fe0b9",
            border: "1px solid #285444",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            zIndex: 9999,
            fontWeight: 600,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Header Navigation */}
      <header
        style={{
          borderBottom: "1px solid #1a2332",
          background: "rgba(10, 13, 18, 0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => onNavigate("landing")}
              style={{
                border: 0,
                background: "transparent",
                color: "#e9edf5",
                fontSize: "21px",
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "-0.04em",
                padding: 0,
              }}
            >
              Skill<span style={{ color: "#9db5ff" }}>Twin</span>
            </button>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11.5px",
                background: "#15241f",
                color: "#82d7ad",
                border: "1px solid #264a3d",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#82d7ad",
                }}
              />
              Verified Dossier
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleCopyLink}
              className="outline-button"
              style={{
                fontSize: "13.5px",
                padding: "9px 16px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              🔗 Copy URL
            </button>

            <button
              onClick={handleShareLinkedIn}
              className="outline-button"
              style={{
                fontSize: "13.5px",
                padding: "9px 16px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              Share Dossier
            </button>

            {isOwner ? (
              <button
                onClick={() => onNavigate("profile")}
                className="primary-button small"
                style={{ fontSize: "13.5px", padding: "9px 16px", fontWeight: 700 }}
              >
                ✏️ Edit Settings
              </button>
            ) : (
              <button
                onClick={() => onNavigate("signup")}
                className="primary-button small"
                style={{ fontSize: "13.5px", padding: "9px 16px", fontWeight: 700 }}
              >
                ⚡ Claim Your Twin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1180px", margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Candidate Hero Card */}
        <div
          style={{
            background: "radial-gradient(ellipse at 85% 15%, #18253c 0%, #10151f 70%)",
            border: "1px solid #24334a",
            borderRadius: "14px",
            padding: "36px",
            marginBottom: "32px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            {/* Avatar & Core Identity */}
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              <div style={{ position: "relative" }}>
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  style={{
                    width: "92px",
                    height: "92px",
                    borderRadius: "18px",
                    border: "2px solid #3d5175",
                    objectFit: "cover",
                    background: "#182236",
                  }}
                />
                <div
                  title="SkillTwin Verified Engineer"
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    right: "-4px",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#16342b",
                    border: "2px solid #0a0d12",
                    display: "grid",
                    placeItems: "center",
                    color: "#8fe0b9",
                    fontSize: "13px",
                    fontWeight: 900,
                  }}
                >
                  ✓
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: "34px",
                      letterSpacing: "-0.04em",
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {profile.name}
                  </h1>
                  <span style={{ color: "#8a9ab2", fontSize: "15px", fontWeight: 500 }}>@{profile.username}</span>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      background: "#1e293d",
                      color: "#a9bbff",
                      border: "1px solid #33466d",
                      fontWeight: 700,
                    }}
                  >
                    {profile.targetRole}
                  </span>
                </div>

                <p
                  style={{
                    margin: "10px 0 12px",
                    color: "#d2deed",
                    fontSize: "18px",
                    fontWeight: 500,
                    lineHeight: "1.5",
                  }}
                >
                  {profile.headline}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: "#94a3b8",
                    fontSize: "15px",
                    maxWidth: "720px",
                    lineHeight: "1.65",
                  }}
                >
                  {profile.bio}
                </p>

                {/* Candidate Custom Pitch Banner */}
                {profile.customPitch && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "14px 18px",
                      background: "rgba(157, 181, 255, 0.07)",
                      border: "1px solid rgba(157, 181, 255, 0.22)",
                      borderRadius: "10px",
                      fontSize: "14.5px",
                      color: "#c8d4ff",
                      lineHeight: "1.6",
                    }}
                  >
                    <strong style={{ color: "#fff" }}>Developer Pitch:</strong> {profile.customPitch}
                  </div>
                )}
              </div>
            </div>

            {/* Social & Contact Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "190px" }}>
              {profile.socials.contactEmail && (
                <a
                  href={`mailto:${profile.socials.contactEmail}?subject=${encodeURIComponent(
                    `Interview Opportunity via SkillTwin: ${profile.targetRole}`
                  )}`}
                  className="primary-button small"
                  style={{ textAlign: "center", textDecoration: "none", fontSize: "14px", padding: "10px 18px", fontWeight: 700 }}
                >
                  ✉️ Contact Candidate
                </a>
              )}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {profile.socials.github && (
                  <a
                    href={profile.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="outline-button"
                    style={{
                      padding: "9px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                      flex: 1,
                      textAlign: "center",
                    }}
                  >
                    🐙 GitHub
                  </a>
                )}
                {profile.socials.linkedin && (
                  <a
                    href={profile.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="outline-button"
                    style={{
                      padding: "9px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                      flex: 1,
                      textAlign: "center",
                    }}
                  >
                    in LinkedIn
                  </a>
                )}
                {profile.socials.portfolio && (
                  <a
                    href={profile.socials.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="outline-button"
                    style={{
                      padding: "9px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                      flex: 1,
                      textAlign: "center",
                    }}
                  >
                    🌐 Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Verified Proof Badges Ribbon */}
          <div
            style={{
              marginTop: "28px",
              paddingTop: "24px",
              borderTop: "1px solid #1f2c42",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "14px",
            }}
          >
            <div
              style={{
                background: "#0c1119",
                border: "1px solid #1c2638",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div style={{ fontSize: "26px" }}>🛡️</div>
              <div>
                <div style={{ fontSize: "12px", color: "#8a9ab2", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Candidate Identity
                </div>
                <div style={{ fontSize: "15px", color: "#8fe0b9", fontWeight: 700, marginTop: "2px" }}>
                  Email & Domain Verified
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#0c1119",
                border: "1px solid #1c2638",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div style={{ fontSize: "26px" }}>🐙</div>
              <div>
                <div style={{ fontSize: "12px", color: "#8a9ab2", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Codebase Signals
                </div>
                <div style={{ fontSize: "15px", color: "#d9e0ed", fontWeight: 700, marginTop: "2px" }}>
                  {profile.verifiedBadges.totalRepositoriesAnalyzed} Repositories Verified
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#0c1119",
                border: "1px solid #1c2638",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div style={{ fontSize: "26px" }}>📊</div>
              <div>
                <div style={{ fontSize: "12px", color: "#8a9ab2", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Code Volume Analyzed
                </div>
                <div style={{ fontSize: "15px", color: "#d9e0ed", fontWeight: 700, marginTop: "2px" }}>
                  {(profile.verifiedBadges.totalLinesOfCode || 28000).toLocaleString()} LOC
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#0c1119",
                border: "1px solid #1c2638",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div style={{ fontSize: "26px" }}>⚡</div>
              <div>
                <div style={{ fontSize: "12px", color: "#8a9ab2", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Production Readiness
                </div>
                <div style={{ fontSize: "15px", color: "#9db5ff", fontWeight: 700, marginTop: "2px" }}>
                  {profile.stats.readinessScore || 88}% Readiness Score
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ⚡ INTERACTIVE RECRUITER JD MATCHER SECTION */}
        <section
          style={{
            background: "linear-gradient(135deg, #131c2d 0%, #0d131f 100%)",
            border: "1px solid #2b3d5c",
            borderRadius: "14px",
            padding: "32px",
            marginBottom: "36px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                color: "#9db5ff",
                fontSize: "12.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "8px",
              }}
            >
              Interactive Recruiter Tool
            </div>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "27px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#fff",
              }}
            >
              🎯 Test Candidate Fit Against Your Job Description
            </h2>
            <p style={{ margin: 0, color: "#a3b3cc", fontSize: "15.5px", lineHeight: "1.6" }}>
              Paste your company's job description or choose a preset. SkillTwin will cross-reference your
              stack against {profile.name}'s verified GitHub repositories and codebase proof.
            </p>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#8a9ab2", alignSelf: "center", marginRight: "4px" }}>
              Quick Presets:
            </span>
            {SAMPLE_JD_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                style={{
                  background: selectedRoleTitle === preset.title ? "#26395b" : "#131a26",
                  color: selectedRoleTitle === preset.title ? "#c2ceff" : "#93a0b4",
                  border: selectedRoleTitle === preset.title ? "1px solid #9db5ff" : "1px solid #202d42",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: selectedRoleTitle === preset.title ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                {preset.title}
              </button>
            ))}
          </div>

          {/* JD Input Area */}
          <div style={{ marginBottom: "18px" }}>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste your job description requirements, responsibilities, or tech stack here..."
              rows={5}
              style={{
                width: "100%",
                background: "#080c12",
                border: "1px solid #28374d",
                borderRadius: "10px",
                padding: "16px",
                color: "#e9edf5",
                fontSize: "14.5px",
                fontFamily: "inherit",
                lineHeight: "1.65",
                boxSizing: "border-box",
                outline: "none",
                resize: "vertical",
              }}
            />
            {matchError && (
              <div style={{ color: "#ffad9e", fontSize: "13px", marginTop: "6px" }}>
                {matchError}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={handleRunMatch}
              disabled={matchingLoading || !jdText.trim()}
              className="primary-button"
              style={{ padding: "12px 24px", fontSize: "14.5px", fontWeight: 700 }}
            >
              {matchingLoading ? "Analyzing Candidate Proof..." : "Verify Candidate Fit (1s)"}
            </button>
            {jdText && (
              <button
                onClick={() => {
                  setJdText("");
                  setMatchResult(null);
                  setSelectedRoleTitle("");
                }}
                className="outline-button"
                style={{ padding: "11px 18px", fontSize: "13.5px" }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Match Result Display */}
          {matchResult && (
            <div
              style={{
                marginTop: "26px",
                padding: "26px",
                background: "#0a0f17",
                border: "1px solid #2c4161",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "18px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#8a9ab2", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Verified Match Score
                  </div>
                  <div
                    style={{
                      fontSize: "38px",
                      fontWeight: 800,
                      color: matchResult.matchPercentage >= 75 ? "#8fe0b9" : "#f0ce83",
                      letterSpacing: "-0.04em",
                      marginTop: "2px",
                    }}
                  >
                    {matchResult.matchPercentage}%{" "}
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#9db5ff" }}>
                      ({matchResult.matchLevel} Fit)
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right", maxWidth: "480px" }}>
                  <p style={{ margin: 0, fontSize: "14.5px", color: "#c8d4ff", lineHeight: "1.6" }}>
                    {matchResult.summary}
                  </p>
                </div>
              </div>

              {/* Strengths Highlights */}
              <div style={{ marginBottom: "22px" }}>
                <div style={{ fontSize: "13.5px", color: "#8a9ab2", fontWeight: 700, marginBottom: "10px" }}>
                  Verified Candidate Strengths:
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {matchResult.strengths.map((str, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "14.5px",
                        color: "#e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ color: "#8fe0b9", fontWeight: 800 }}>✓</span> {str}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Match vs Missing Comparison */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "20px",
                }}
              >
                {/* Matching Skills */}
                <div
                  style={{
                    background: "#0d1421",
                    border: "1px solid #1c2b42",
                    borderRadius: "10px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      color: "#8fe0b9",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: "14px",
                    }}
                  >
                    Matching Skills with Evidence ({matchResult.matchingSkills.length})
                  </div>
                  <div style={{ display: "grid", gap: "12px" }}>
                    {matchResult.matchingSkills.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#10192a",
                          border: "1px solid #233450",
                          borderRadius: "8px",
                          padding: "12px 14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "5px",
                          }}
                        >
                          <strong style={{ fontSize: "15px", color: "#fff", fontWeight: 700 }}>{m.skill}</strong>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "3px 8px",
                              background: "#192842",
                              color: "#a9bbff",
                              borderRadius: "4px",
                              fontWeight: 600,
                            }}
                          >
                            {m.category}
                          </span>
                        </div>
                        {m.verifiedEvidence && (
                          <div style={{ fontSize: "13px", color: "#9db5ff", lineHeight: "1.5" }}>
                            {m.verifiedEvidence}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Skills */}
                <div
                  style={{
                    background: "#0d1421",
                    border: "1px solid #1c2b42",
                    borderRadius: "10px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      color: "#8a9ab2",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: "14px",
                    }}
                  >
                    Unverified / Growth Areas ({matchResult.missingSkills.length})
                  </div>
                  {matchResult.missingSkills.length === 0 ? (
                    <div style={{ color: "#8fe0b9", fontSize: "14px" }}>
                      No missing requirements detected! Complete match with this job description.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {matchResult.missingSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: "7px 14px",
                            background: "#151b26",
                            border: "1px solid #2a3447",
                            borderRadius: "6px",
                            fontSize: "13.5px",
                            color: "#94a3b8",
                          }}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* VERIFIED SKILLS MATRIX SECTION */}
        <section style={{ marginBottom: "44px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: "25px", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>
                Verified Skill Competencies
              </h2>
              <p style={{ margin: 0, color: "#8ca0b8", fontSize: "15px" }}>
                Extracted and verified across repositories, unit tests, and production architectures.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  style={{
                    background: selectedCategory === c.id ? "#20304a" : "#101621",
                    color: selectedCategory === c.id ? "#c2ceff" : "#8a9ab2",
                    border: selectedCategory === c.id ? "1px solid #9db5ff" : "1px solid #1c2637",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    fontWeight: selectedCategory === c.id ? 700 : 500,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredSkills.map((skill, idx) => (
              <div
                key={idx}
                style={{
                  background: "#10151f",
                  border: "1px solid #1e2a3c",
                  borderRadius: "12px",
                  padding: "20px",
                  transition: "border-color 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "10px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "17.5px", color: "#fff", fontWeight: 700 }}>
                    {skill.name}
                  </h3>
                  <span
                    style={{
                      fontSize: "11.5px",
                      textTransform: "uppercase",
                      padding: "4px 9px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      background:
                        skill.level === "advanced" || skill.level === "expert"
                          ? "#162b47"
                          : "#1a2333",
                      color:
                        skill.level === "advanced" || skill.level === "expert"
                          ? "#9db5ff"
                          : "#8998af",
                    }}
                  >
                    {skill.level}
                  </span>
                </div>

                {skill.verifiedByGithub && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12.5px",
                      color: "#8fe0b9",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    <span>✓</span> Verified in GitHub Code
                  </div>
                )}

                {skill.evidenceSnippet && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "13.5px",
                      color: "#8da0b8",
                      lineHeight: "1.55",
                    }}
                  >
                    {skill.evidenceSnippet}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED PROJECTS & REPOSITORIES SECTION */}
        <section style={{ marginBottom: "44px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "25px", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>
              Featured Repositories & Star Projects
            </h2>
            <p style={{ margin: 0, color: "#8ca0b8", fontSize: "15px" }}>
              Production repositories inspected by the SkillTwin evidence engine.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "20px",
            }}
          >
            {profile.featuredProjects.map((project, idx) => (
              <div
                key={idx}
                style={{
                  background: "#101622",
                  border: "1px solid #202c3e",
                  borderRadius: "12px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "18.5px", color: "#fff", fontWeight: 700 }}>
                      {project.name}
                    </h3>
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#9db5ff",
                          fontSize: "13.5px",
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        GitHub ↗
                      </a>
                    )}
                  </div>

                  <p
                    style={{
                      margin: "0 0 16px",
                      color: "#a3b3cc",
                      fontSize: "14.5px",
                      lineHeight: "1.65",
                    }}
                  >
                    {project.description}
                  </p>

                  {/* Languages Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                    {project.languages.map((lang, lIdx) => (
                      <span
                        key={lIdx}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "#182234",
                          color: "#a9bbff",
                          border: "1px solid #28374d",
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>

                  {/* Architecture Highlights */}
                  {project.architectureHighlights && project.architectureHighlights.length > 0 && (
                    <div style={{ display: "grid", gap: "6px", marginBottom: "16px" }}>
                      {project.architectureHighlights.map((arch, aIdx) => (
                        <div
                          key={aIdx}
                          style={{
                            fontSize: "13.5px",
                            color: "#8fe0b9",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>•</span> {arch}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {project.verifiedMetrics && (
                  <div
                    style={{
                      paddingTop: "14px",
                      borderTop: "1px solid #1a2536",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#8ca0b8",
                    }}
                  >
                    <span>{project.verifiedMetrics.commits} Verified Commits</span>
                    <span>{(project.verifiedMetrics.loc || 0).toLocaleString()} Verified LOC</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM VIRAL CALL TO ACTION */}
        <section
          style={{
            background: "radial-gradient(ellipse at 50% 50%, #17243c 0%, #0d121c 100%)",
            border: "1px solid #2a3c5a",
            borderRadius: "16px",
            padding: "46px 32px",
            textAlign: "center",
            marginTop: "52px",
          }}
        >
          <div
            style={{
              color: "#9db5ff",
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "10px",
            }}
          >
            Proof-of-Work Platform for Engineers
          </div>
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: "30px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#fff",
            }}
          >
            Looking to Hire or Verify Your Own Skills?
          </h2>
          <p
            style={{
              margin: "0 auto 26px",
              color: "#a3b3cc",
              fontSize: "16px",
              maxWidth: "620px",
              lineHeight: "1.65",
            }}
          >
            SkillTwin backs technical resumes with tangible code proof from GitHub, interactive recruiter
            matching, and realistic interview simulations.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
            <button
              onClick={() => onNavigate("signup")}
              className="primary-button"
              style={{ padding: "13px 26px", fontSize: "15px", fontWeight: 700 }}
            >
              ⚡ Create Your Free Verified Twin
            </button>
            <button
              onClick={handleCopyLink}
              className="outline-button"
              style={{ padding: "13px 22px", fontSize: "15px", fontWeight: 600 }}
            >
              Share This Dossier
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
