import React, { useState } from "react";
import {
  Briefcase,
  Building,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Layers,
  ArrowRight,
  ArrowLeft,
  Tag,
  Star,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Clock,
  Code2,
  Database,
  Cpu,
  Terminal,
  Cloud,
  Users,
  Compass,
} from "lucide-react";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import { EmptyState } from "../common/EmptyState.js";
import type { JobExtraction, JobAnalysis, JobSkillRequirement } from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface JobAnalysisViewProps {
  job: JobExtraction | null;
  jobAnalysis?: JobAnalysis | null;
  onNavigate: (screen: ActiveScreen) => void;
  onRunGapAnalysis?: () => void;
}

export const JobAnalysisView: React.FC<JobAnalysisViewProps> = ({
  job,
  jobAnalysis,
  onNavigate,
  onRunGapAnalysis,
}) => {
  const [filterType, setFilterType] = useState<"all" | "required" | "preferred">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showRawText, setShowRawText] = useState(false);

  if (!job) {
    return (
      <EmptyState
        icon={<Briefcase size={24} />}
        title="No Job Description Analyzed"
        description="Please upload or paste a target job description to extract role requirements and normalized competencies."
        actionText="Upload Job Description"
        onAction={() => onNavigate("jd_upload")}
      />
    );
  }

  // Combine and annotate skills for filtering
  const allSkills: JobSkillRequirement[] = [
    ...job.requiredSkills.map((s) => ({ ...s, importance: "Required" as const })),
    ...job.preferredSkills.map((s) => ({ ...s, importance: "Preferred" as const })),
  ];

  // Distinct categories from extracted skills
  const availableCategories = Array.from(new Set(allSkills.map((s) => s.category)));

  // Filter skills based on tab, category, and search query
  const filteredSkills = allSkills.filter((s) => {
    if (filterType === "required" && s.importance !== "Required") return false;
    if (filterType === "preferred" && s.importance !== "Preferred") return false;
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.canonicalName.toLowerCase().includes(q);
      const matchCat = s.category.toLowerCase().includes(q);
      const matchContext = s.contextSentence?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchContext) return false;
    }
    return true;
  });

  // Calculate total keywords
  const totalKeywordsCount =
    (job.keywords.programmingLanguages?.length || 0) +
    (job.keywords.frameworks?.length || 0) +
    (job.keywords.libraries?.length || 0) +
    (job.keywords.databases?.length || 0) +
    (job.keywords.tools?.length || 0) +
    (job.keywords.cloudDevOps?.length || 0) +
    (job.keywords.softSkills?.length || 0) +
    (job.keywords.cybersecurity?.length || 0) +
    (job.keywords.generalKeywords?.length || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft size={13} />}
              onClick={() => onNavigate("jd_upload")}
            >
              Upload / Ingest
            </Button>
            <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>{job.title}</h2>
            {job.company && (
              <Badge variant="neutral" icon={<Building size={12} />}>
                {job.company}
              </Badge>
            )}
            <Badge variant="match" icon={<ShieldCheck size={12} />}>
              Skill Engine Normalized
            </Badge>
          </div>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
            Job Description Intelligence parsed into strict required vs. preferred criteria, normalized via the Skill Engine.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight size={13} />}
            aria-label="Compare With My Skills • Compare Against My Skills"
            onClick={onRunGapAnalysis || (() => onNavigate("gap_analysis"))}
          >
            Compare With My Skills
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Analyze Another Job • Ingest Another JD"
            onClick={() => onNavigate("jd_upload")}
          >
            Analyze Another Job
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("skill_matrix")}
          >
            View Skill Matrix
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
        }}
      >
        {/* Experience Requirement */}
        <div
          style={{
            padding: "16px 18px",
            background: "var(--bg-elevated)",
            borderRadius: "10px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>
            <Clock size={13} />
            <span>Experience Level</span>
          </div>
          <div style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-primary)", marginTop: "6px" }}>
            {job.experience.minYears ? `${job.experience.minYears}+ Years` : job.experience.level}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            {job.experience.description || `${job.experience.level} role expectation`}
          </div>
        </div>

        {/* Required Must-Haves */}
        <div
          style={{
            padding: "16px 18px",
            background: "rgba(239, 68, 68, 0.08)",
            borderRadius: "10px",
            border: "1px solid rgba(239, 68, 68, 0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>
            <AlertCircle size={13} />
            <span>Required (Must Haves)</span>
          </div>
          <div style={{ fontSize: "19px", fontWeight: 700, color: "#f87171", marginTop: "6px" }}>
            {job.requiredSkills.length} Mandatory Skills
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Explicit gating requirements for role
          </div>
        </div>

        {/* Preferred Nice-to-Haves */}
        <div
          style={{
            padding: "16px 18px",
            background: "rgba(96, 165, 250, 0.08)",
            borderRadius: "10px",
            border: "1px solid rgba(96, 165, 250, 0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-accent)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>
            <Star size={13} />
            <span>Preferred (Nice-to-Have)</span>
          </div>
          <div style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-accent)", marginTop: "6px" }}>
            {job.preferredSkills.length} Optional Skills
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Secondary competitive advantages
          </div>
        </div>

        {/* Education Requirement */}
        <div
          style={{
            padding: "16px 18px",
            background: "var(--bg-elevated)",
            borderRadius: "10px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>
            <GraduationCap size={13} />
            <span>Education Requirement</span>
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginTop: "6px", lineHeight: "1.3" }}>
            {job.education || "Practical experience recognized"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Academic / degree expectation
          </div>
        </div>

        {/* Total Indexed Keywords */}
        <div
          style={{
            padding: "16px 18px",
            background: "var(--bg-elevated)",
            borderRadius: "10px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>
            <Tag size={13} />
            <span>Taxonomy Keywords</span>
          </div>
          <div style={{ fontSize: "19px", fontWeight: 700, color: "var(--text-primary)", marginTop: "6px" }}>
            {totalKeywordsCount} Extracted
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Across 8 technology categories
          </div>
        </div>
      </div>

      {/* Main Section: Competencies Filter & List */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", width: "100%", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Layers size={18} color="var(--text-accent)" />
              <span>Competencies & Skill Criteria</span>
              <Badge variant="neutral">{filteredSkills.length} Displayed</Badge>
            </div>

            {/* Filter Toggle Buttons */}
            <div style={{ display: "flex", gap: "6px", background: "var(--bg-canvas)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <button
                className={`tab-btn ${filterType === "all" ? "active" : ""}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setFilterType("all")}
              >
                All ({allSkills.length})
              </button>
              <button
                className={`tab-btn ${filterType === "required" ? "active" : ""}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setFilterType("required")}
              >
                Required ({job.requiredSkills.length})
              </button>
              <button
                className={`tab-btn ${filterType === "preferred" ? "active" : ""}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setFilterType("preferred")}
              >
                Preferred ({job.preferredSkills.length})
              </button>
            </div>
          </div>
        }
      >
        {/* Search & Category Filter Toolbar */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "18px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search competencies by name, category, or quote..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: "6px",
                background: "var(--bg-canvas)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "12.5px",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            <button
              onClick={() => setSelectedCategory("all")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: selectedCategory === "all" ? "1px solid var(--border-accent)" : "1px solid var(--border-subtle)",
                background: selectedCategory === "all" ? "var(--bg-hover)" : "var(--bg-canvas)",
                color: selectedCategory === "all" ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "11.5px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              All Categories
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: selectedCategory === cat ? "1px solid var(--border-accent)" : "1px solid var(--border-subtle)",
                  background: selectedCategory === cat ? "var(--bg-hover)" : "var(--bg-canvas)",
                  color: selectedCategory === cat ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "11.5px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Grid */}
        {filteredSkills.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            No competencies match the selected filters.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "12px" }}>
            {filteredSkills.map((skill, idx) => {
              const isRequired = skill.importance === "Required";
              return (
                <div
                  key={`${skill.canonicalName}-${idx}`}
                  style={{
                    padding: "14px 16px",
                    background: "var(--bg-elevated)",
                    borderRadius: "8px",
                    border: isRequired
                      ? "1px solid rgba(239, 68, 68, 0.3)"
                      : "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--text-primary)" }}>
                          {skill.canonicalName}
                        </span>
                        <Badge variant="neutral">{skill.category}</Badge>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Level: {skill.minimumProficiency || "Intermediate"}
                      </div>
                    </div>

                    {isRequired ? (
                      <Badge variant="gap">
                        REQUIRED
                      </Badge>
                    ) : (
                      <Badge variant="optional">
                        PREFERRED
                      </Badge>
                    )}
                  </div>

                  {skill.contextSentence && (
                    <div
                      style={{
                        padding: "8px 10px",
                        background: "var(--bg-canvas)",
                        borderRadius: "6px",
                        borderLeft: isRequired ? "2px solid #ef4444" : "2px solid #64748b",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontStyle: "italic",
                        lineHeight: "1.4",
                      }}
                    >
                      "{skill.contextSentence}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Categorized Keywords Breakdown (8 Categories) */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Tag size={18} color="var(--text-accent)" />
            <span>Extracted Technical Ecosystem by Category</span>
          </div>
        }
        description="Explicit technologies identified in the job posting and mapped into categorical taxonomies."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {/* Programming Languages */}
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              <Code2 size={14} color="#60a5fa" />
              <span>Programming Languages ({job.keywords.programmingLanguages?.length || 0})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.keywords.programmingLanguages?.length ? (
                job.keywords.programmingLanguages.map((k) => (
                  <Badge key={k} variant="neutral">{k}</Badge>
                ))
              ) : (
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>None explicitly specified</span>
              )}
            </div>
          </div>

          {/* Frameworks */}
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              <Cpu size={14} color="#a78bfa" />
              <span>Frameworks ({job.keywords.frameworks?.length || 0})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.keywords.frameworks?.length ? (
                job.keywords.frameworks.map((k) => (
                  <Badge key={k} variant="neutral">{k}</Badge>
                ))
              ) : (
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>None explicitly specified</span>
              )}
            </div>
          </div>

          {/* Libraries */}
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              <Layers size={14} color="#34d399" />
              <span>Libraries ({job.keywords.libraries?.length || 0})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.keywords.libraries?.length ? (
                job.keywords.libraries.map((k) => (
                  <Badge key={k} variant="neutral">{k}</Badge>
                ))
              ) : (
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>None explicitly specified</span>
              )}
            </div>
          </div>

          {/* Databases */}
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              <Database size={14} color="#f59e0b" />
              <span>Databases & Stores ({job.keywords.databases?.length || 0})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.keywords.databases?.length ? (
                job.keywords.databases.map((k) => (
                  <Badge key={k} variant="neutral">{k}</Badge>
                ))
              ) : (
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>None explicitly specified</span>
              )}
            </div>
          </div>

          {/* Tools & Ecosystem */}
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              <Terminal size={14} color="#38bdf8" />
              <span>Tools & Ecosystem ({job.keywords.tools?.length || 0})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.keywords.tools?.length ? (
                job.keywords.tools.map((k) => (
                  <Badge key={k} variant="neutral">{k}</Badge>
                ))
              ) : (
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>None explicitly specified</span>
              )}
            </div>
          </div>

          {/* Cloud & DevOps */}
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              <Cloud size={14} color="#818cf8" />
              <span>Cloud & Infrastructure ({job.keywords.cloudDevOps?.length || 0})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.keywords.cloudDevOps?.length ? (
                job.keywords.cloudDevOps.map((k) => (
                  <Badge key={k} variant="neutral">{k}</Badge>
                ))
              ) : (
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>None explicitly specified</span>
              )}
            </div>
          </div>

          {/* Soft Skills & Practices */}
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              <Users size={14} color="#f472b6" />
              <span>Soft Skills & Practices ({job.keywords.softSkills?.length || 0})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.keywords.softSkills?.length ? (
                job.keywords.softSkills.map((k) => (
                  <Badge key={k} variant="neutral">{k}</Badge>
                ))
              ) : (
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>None explicitly specified</span>
              )}
            </div>
          </div>

          {/* General & Architecture Keywords */}
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              <Compass size={14} color="#fbbf24" />
              <span>Architecture & Concepts ({job.keywords.generalKeywords?.length || 0})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.keywords.generalKeywords?.length ? (
                job.keywords.generalKeywords.map((k) => (
                  <Badge key={k} variant="neutral">{k}</Badge>
                ))
              ) : (
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>None explicitly specified</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Responsibilities & Qualifications Split Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "20px" }}>
        {/* Core Responsibilities */}
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CheckCircle2 size={18} color="var(--color-match)" />
              <span>Key Responsibilities ({job.responsibilities?.length || 0})</span>
            </div>
          }
          description="Day-to-day deliverables and team contributions extracted from the posting."
        >
          {job.responsibilities && job.responsibilities.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {job.responsibilities.map((resp, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 12px",
                    background: "var(--bg-elevated)",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    lineHeight: "1.45",
                  }}
                >
                  <span style={{ color: "var(--color-match)", fontWeight: 700, fontSize: "14px", marginTop: "-1px" }}>
                    •
                  </span>
                  <span>{resp}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              No explicit responsibilities bullet points were extracted from this job description.
            </div>
          )}
        </Card>

        {/* Qualifications & Requirements */}
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <GraduationCap size={18} color="var(--text-accent)" />
              <span>Qualifications & Background Criteria</span>
            </div>
          }
          description="Experience requirements and qualifications extracted from the posting."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Experience Expectation
              </span>
              <p style={{ fontSize: "13.5px", color: "var(--text-primary)", fontWeight: 600, marginTop: "2px" }}>
                {job.experience.description || `${job.experience.minYears || 0}+ Years (${job.experience.level})`}
              </p>
            </div>

            {job.education && (
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  Education Expectation
                </span>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {job.education}
                </p>
              </div>
            )}

            <div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                Required Qualifications List ({job.qualifications?.length || 0})
              </span>
              {job.qualifications && job.qualifications.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {job.qualifications.map((qual, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 12px",
                        background: "var(--bg-elevated)",
                        borderRadius: "6px",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "12.5px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {qual}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  Extracted from overall role requirements.
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Raw Extracted Text Drawer (Collapsible) */}
      <Card
        title={
          <div
            onClick={() => setShowRawText(!showRawText)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FileText size={16} color="var(--text-muted)" />
              <span style={{ fontSize: "14px" }}>Inspect Raw Ingested Job Text</span>
            </div>
            {showRawText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        }
      >
        {showRawText && (
          <pre
            style={{
              padding: "14px",
              background: "var(--bg-canvas)",
              borderRadius: "6px",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {job.rawText}
          </pre>
        )}
      </Card>
    </div>
  );
};
