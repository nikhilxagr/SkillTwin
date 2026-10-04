import React from "react";
import {
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  GitCompare,
  Code2,
  FileSearch,
} from "lucide-react";
import { Button } from "../common/Button.js";
import { Badge } from "../common/Badge.js";

interface LandingPageProps {
  onEnterApp: () => void;
  onLoadSample: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onLoadSample }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.15), rgba(7, 9, 14, 1))",
        color: "var(--text-primary)",
        padding: "32px 24px 80px",
      }}
    >
      {/* Top Navbar */}
      <nav
        style={{
          maxWidth: "1140px",
          margin: "0 auto 80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #2563eb, #38bdf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Terminal size={18} />
          </div>
          <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Skill<span style={{ color: "var(--text-accent)" }}>Twin</span>
          </span>
          <Badge variant="neutral">Developer Career Intelligence</Badge>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Button variant="outline" size="sm" onClick={onLoadSample} icon={<Sparkles size={13} />}>
            Explore Sample Profile
          </Button>
          <Button variant="primary" size="sm" onClick={onEnterApp}>
            Open Workspace
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: "960px",
          margin: "0 auto 64px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "9999px",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-accent)",
            marginBottom: "24px",
          }}
        >
          <ShieldCheck size={14} /> Evidence-First AI Career Intelligence
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 62px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.04em",
            marginBottom: "24px",
          }}
        >
          Stop guessing your readiness. <br />
          <span
            style={{
              background: "linear-gradient(to right, #60a5fa, #38bdf8, #34d399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Quantify your actual skills with evidence.
          </span>
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            maxWidth: "680px",
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          SkillTwin ingests your real developer resume, extracts claimed vs. demonstrated technical
          skills, compares them against target job descriptions, and gives you transparent,
          non-hallucinatory career guidance.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <Button
            variant="primary"
            size="lg"
            onClick={onEnterApp}
            icon={<ArrowRight size={16} />}
            style={{ padding: "14px 28px", fontSize: "15px" }}
          >
            Analyze My Career Data
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onLoadSample}
            icon={<Sparkles size={16} />}
            style={{ padding: "14px 24px", fontSize: "15px" }}
          >
            Load Realistic Demo Profile
          </Button>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section
        style={{
          maxWidth: "1140px",
          margin: "0 auto 64px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        <div className="twin-panel" style={{ background: "var(--bg-surface)" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "var(--text-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <Code2 size={20} />
          </div>
          <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>
            Claimed vs. Demonstrated Skills
          </h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Anyone can write "Docker" or "Testing" in a skills list. SkillTwin inspects your actual
            project bullets, frameworks, and architecture to build an honest confidence score.
          </p>
        </div>

        <div className="twin-panel" style={{ background: "var(--bg-surface)" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "var(--color-match)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <GitCompare size={20} />
          </div>
          <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>
            Deterministic 5-Tier Gap Engine
          </h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Categorizes your gaps into <strong>Critical Gaps</strong>, <strong>Partial Gaps</strong>,{" "}
            <strong>Weak Evidence</strong>, <strong>Matches</strong>, and <strong>Optional</strong>.
            No arbitrary "ATS 87%" guesswork.
          </p>
        </div>

        <div className="twin-panel" style={{ background: "var(--bg-surface)" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "var(--color-partial)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <FileSearch size={20} />
          </div>
          <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>
            Zero-Hallucination Optimization
          </h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Never invents fake metrics or unpracticed technologies. Offers grounded bullet
            enhancements and advises you when a skill should be genuinely practiced first.
          </p>
        </div>
      </section>

      {/* Interactive Micro-Preview */}
      <section
        style={{
          maxWidth: "1140px",
          margin: "0 auto",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "14px",
          padding: "32px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h4 style={{ fontSize: "16px", fontWeight: 700 }}>Live Intelligence Preview</h4>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Sample Developer: Alex Rivera vs Senior Full Stack Engineer JD
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onLoadSample}>
            View Full Analysis
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <div style={{ padding: "16px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>React.js</span>
              <Badge variant="match">MATCH • Strong</Badge>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              ✓ Listed in resume • Used in 2 major projects • Component library demonstrated.
            </p>
          </div>

          <div style={{ padding: "16px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>Docker</span>
              <Badge variant="gap">CRITICAL GAP</Badge>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              ⚠ Listed as 'Basic' in skills list; 0 Dockerfiles or container bullets found.
            </p>
          </div>

          <div style={{ padding: "16px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>Automated Testing</span>
              <Badge variant="gap">CRITICAL GAP</Badge>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              ✗ Required for Senior role; Vitest or Jest test suites not demonstrated.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
