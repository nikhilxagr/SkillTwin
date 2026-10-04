import React, { useState } from "react";
import {
  FileText,
  User,
  Briefcase,
  Code2,
  GraduationCap,
  ExternalLink,
  Globe,
  Link2,
  ArrowLeft,
  Binary,
} from "lucide-react";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import { EmptyState } from "../common/EmptyState.js";
import type { ResumeExtraction } from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface ResumeStructuredViewProps {
  resume: ResumeExtraction | null;
  onNavigate: (screen: ActiveScreen) => void;
}

export const ResumeStructuredView: React.FC<ResumeStructuredViewProps> = ({
  resume,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<"entities" | "raw">("entities");

  if (!resume) {
    return (
      <EmptyState
        icon={<FileText size={24} />}
        title="No Resume Selected"
        description="Please upload a resume first to inspect extracted structured data."
        actionText="Go to Upload"
        onAction={() => onNavigate("resume_upload")}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft size={13} />}
              onClick={() => onNavigate("resume_upload")}
            >
              Upload View
            </Button>
            <h2 style={{ fontSize: "22px", fontWeight: 700 }}>Structured Resume Inspector</h2>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            Document: <span className="font-mono">{resume.fileName}</span> • Parsed into verified Zod contracts
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "3px" }}>
            <button
              className={`tab-btn ${activeTab === "entities" ? "active" : ""}`}
              onClick={() => setActiveTab("entities")}
              style={{ padding: "6px 14px", fontSize: "12px", border: 0 }}
            >
              Structured Entities
            </button>
            <button
              className={`tab-btn ${activeTab === "raw" ? "active" : ""}`}
              onClick={() => setActiveTab("raw")}
              style={{ padding: "6px 14px", fontSize: "12px", border: 0 }}
            >
              Raw Extracted Text
            </button>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Binary size={13} />}
            onClick={() => onNavigate("skill_matrix")}
          >
            Open Skill Matrix
          </Button>
        </div>
      </div>

      {activeTab === "entities" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "20px" }}>
          {/* Left Column: Profile & Claimed Skills */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Card title="Candidate Profile" icon={<User size={16} />}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{resume.profile.name || "Candidate"}</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{resume.profile.location}</p>
                </div>

                {resume.profile.summary && (
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                    {resume.profile.summary}
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
                  {resume.profile.githubUrl && (
                    <a
                      href={resume.profile.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: "var(--text-accent)",
                        textDecoration: "none",
                      }}
                    >
                      <Globe size={13} /> GitHub Profile
                    </a>
                  )}
                  {resume.profile.linkedinUrl && (
                    <a
                      href={resume.profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: "var(--text-accent)",
                        textDecoration: "none",
                      }}
                    >
                      <Link2 size={13} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </Card>

            <Card
              title={`Claimed Skills (${resume.skillsClaimed.length})`}
              description="Directly stated in skills section (pending project verification)."
              icon={<Code2 size={16} />}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {resume.skillsClaimed.map((skill) => (
                  <Badge key={skill} variant="neutral">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card title="Education & Credentials" icon={<GraduationCap size={16} />}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {resume.education.map((edu, idx) => (
                  <div key={idx} style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontWeight: 600, fontSize: "13.5px" }}>{edu.degree}</div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>{edu.institution}</div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {edu.startDate} – {edu.endDate}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Projects & Experience */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Card
              title={`Detected Projects (${resume.projects.length})`}
              description="Primary source for demonstrated skill evidence."
              icon={<Code2 size={16} />}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {resume.projects.map((proj) => (
                  <div
                    key={proj.name}
                    style={{
                      padding: "16px",
                      background: "var(--bg-elevated)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>
                          {proj.name}
                        </span>
                        {proj.description && (
                          <span style={{ fontSize: "12.5px", color: "var(--text-muted)", marginLeft: "8px" }}>
                            • {proj.description}
                          </span>
                        )}
                      </div>
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--text-accent)", fontSize: "12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          Repo <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
                      {proj.technologies.map((t) => (
                        <Badge key={t} variant="neutral" style={{ fontSize: "11px" }}>
                          {t}
                        </Badge>
                      ))}
                    </div>

                    <ul style={{ paddingLeft: "18px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                      {proj.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title={`Work History (${resume.experience.length})`}
              description="Commercial implementation signals."
              icon={<Briefcase size={16} />}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {resume.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    style={{
                      paddingBottom: "14px",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>
                        {exp.role} <span style={{ color: "var(--text-accent)" }}>@ {exp.company}</span>
                      </span>
                      <span className="font-mono" style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>

                    <ul style={{ paddingLeft: "18px", marginTop: "8px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      {exp.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card title="Raw Extracted Text Stream">
          <pre
            style={{
              padding: "16px",
              background: "var(--bg-canvas)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              fontSize: "12.5px",
              fontFamily: "var(--font-mono)",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: "600px",
              overflowY: "auto",
            }}
          >
            {resume.rawText}
          </pre>
        </Card>
      )}
    </div>
  );
};
