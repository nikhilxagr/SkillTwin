import React, { useState } from "react";
import {
  Binary,
  Search,
  Filter,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Card } from "../common/Card.js";
import { Badge } from "../common/Badge.js";
import { Button } from "../common/Button.js";
import { ProgressBar } from "../common/ProgressBar.js";
import { EmptyState } from "../common/EmptyState.js";
import { EvidenceDrawer } from "./EvidenceDrawer.js";
import type { SkillMatrix, SkillMatrixItem, SkillCategory, SkillEvidenceLevel } from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface SkillMatrixViewProps {
  matrix: SkillMatrix | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLoadSample: () => void;
}

const CATEGORIES: Array<"All" | SkillCategory> = [
  "All",
  "Languages",
  "Frontend",
  "Backend",
  "Databases",
  "Cloud/DevOps",
  "Testing",
  "System Design",
  "Tools",
];

export const SkillMatrixView: React.FC<SkillMatrixViewProps> = ({
  matrix,
  onNavigate,
  onLoadSample,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"All" | SkillCategory>("All");
  const [selectedLevel, setSelectedLevel] = useState<"All" | SkillEvidenceLevel>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectedSkill, setInspectedSkill] = useState<SkillMatrixItem | null>(null);

  if (!matrix) {
    return (
      <EmptyState
        icon={<Binary size={24} />}
        title="Skill Matrix Not Generated"
        description="Upload a technical resume to run the evidence extractor and build your canonical skill matrix."
        actionText="Upload Resume"
        onAction={() => onNavigate("resume_upload")}
        secondaryActionText="Load Sample Profile"
        onSecondaryAction={onLoadSample}
      />
    );
  }

  // Filter skills
  const filteredSkills = matrix.items.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesLevel =
      selectedLevel === "All" || item.evidenceLevel === selectedLevel;
    const matchesSearch =
      searchQuery === "" ||
      item.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesLevel && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Canonical Skill Matrix
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Evidence-backed proficiencies derived from resume statements, projects, and work history.
            Scores reflect corroborating implementation signals, not arbitrary percentages.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight size={13} />}
            onClick={() => onNavigate("jd_upload")}
          >
            Compare with Target Job
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <span className="stat-label">Total Identified</span>
          <span className="stat-value" style={{ fontSize: "22px" }}>
            {matrix.summary.totalSkills}
          </span>
        </div>
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <span className="stat-label" style={{ color: "var(--color-match)" }}>
            Demonstrated
          </span>
          <span className="stat-value" style={{ fontSize: "22px", color: "var(--color-match)" }}>
            {matrix.summary.demonstratedCount}
          </span>
        </div>
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <span className="stat-label" style={{ color: "var(--color-partial)" }}>
            Claimed Only
          </span>
          <span className="stat-value" style={{ fontSize: "22px", color: "var(--color-partial)" }}>
            {matrix.summary.claimedOnlyCount}
          </span>
        </div>
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <span className="stat-label" style={{ color: "var(--color-weak)" }}>
            Weak Evidence
          </span>
          <span className="stat-value" style={{ fontSize: "22px", color: "var(--color-weak)" }}>
            {matrix.summary.weakEvidenceCount}
          </span>
        </div>
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <span className="stat-label">Average Confidence</span>
          <span className="stat-value" style={{ fontSize: "22px" }}>
            {matrix.summary.averageConfidence}%
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Category Tabs */}
          <div className="tabs-header" style={{ marginBottom: "0px" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`tab-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Level Filters */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills (e.g. React, Docker, Python)..."
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "6px",
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Evidence Filter:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as any)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  background: "var(--bg-canvas)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "12.5px",
                }}
              >
                <option value="All">All Evidence Levels</option>
                <option value="Demonstrated">Demonstrated (Project & Work)</option>
                <option value="ClaimedOnly">Claimed Only (In List)</option>
                <option value="WeakEvidence">Weak Evidence (Needs Proof)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card>
        {filteredSkills.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13.5px" }}>
            No skills match your active filter criteria. Try clearing search or selecting "All".
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Category</th>
                  <th>Proficiency</th>
                  <th>Confidence</th>
                  <th>Evidence</th>
                  <th>Weak / Strong Evidence</th>
                  <th>Missing Evidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkills.map((skill) => (
                  <tr
                    key={skill.canonicalName}
                    style={{ cursor: "pointer" }}
                    onClick={() => setInspectedSkill(skill)}
                  >
                    {/* 1. Skill & Aliases */}
                    <td>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-primary)" }}>
                          {skill.canonicalName}
                        </span>
                        {skill.aliases.length > 0 && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                            Aliases: {skill.aliases.join(", ")}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. Category */}
                    <td>
                      <Badge variant="neutral">{skill.category}</Badge>
                    </td>

                    {/* 3. Proficiency */}
                    <td>
                      <Badge
                        variant={
                          skill.proficiency === "Strong"
                            ? "match"
                            : skill.proficiency === "Intermediate"
                            ? "neutral"
                            : skill.proficiency === "Beginner"
                            ? "partial"
                            : "weak"
                        }
                      >
                        {skill.proficiency}
                      </Badge>
                    </td>

                    {/* 4. Confidence */}
                    <td style={{ minWidth: "150px" }}>
                      <ProgressBar value={skill.confidence} showLabel />
                    </td>

                    {/* 5. Evidence Citations */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {skill.evidence.length} citation{skill.evidence.length === 1 ? "" : "s"}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {skill.evidence.some((e) => e.sourceType === "work_experience")
                            ? "Work & Projects"
                            : skill.evidence.some((e) => e.sourceType === "project")
                            ? "Project Evidence"
                            : "Skills List Only"}
                        </span>
                      </div>
                    </td>

                    {/* 6. Weak / Strong Evidence */}
                    <td>
                      <Badge
                        variant={
                          skill.evidenceLevel === "Demonstrated"
                            ? "match"
                            : skill.evidenceLevel === "WeakEvidence"
                            ? "weak"
                            : "partial"
                        }
                      >
                        {skill.evidenceLevel === "Demonstrated" && <CheckCircle2 size={11} />}
                        {skill.evidenceLevel === "WeakEvidence" && <AlertTriangle size={11} />}
                        {skill.evidenceLevel === "ClaimedOnly" && <FileQuestion size={11} />}
                        {skill.evidenceLevel === "Demonstrated"
                          ? "Strong (Demonstrated)"
                          : skill.evidenceLevel === "WeakEvidence"
                          ? "Weak Evidence"
                          : "Claimed Only"}
                      </Badge>
                    </td>

                    {/* 7. Missing Evidence */}
                    <td style={{ maxWidth: "240px" }}>
                      {skill.missingEvidence.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "6px",
                            fontSize: "12px",
                            color: "var(--color-partial)",
                            lineHeight: "1.4",
                          }}
                        >
                          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: "2px" }} />
                          <div>
                            <span>{skill.missingEvidence[0]}</span>
                            {skill.missingEvidence.length > 1 && (
                              <span style={{ opacity: 0.7, marginLeft: "4px" }}>
                                (+{skill.missingEvidence.length - 1} more)
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            color: "var(--color-match)",
                          }}
                        >
                          <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                          <span>Corroborated</span>
                        </div>
                      )}
                    </td>

                    {/* 8. Actions */}
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedSkill(skill);
                        }}
                        icon={<ChevronRight size={13} />}
                      >
                        Inspect Evidence ({skill.evidence.length})
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Slide-Over Evidence Drawer */}
      <EvidenceDrawer skill={inspectedSkill} onClose={() => setInspectedSkill(null)} />
    </div>
  );
};
