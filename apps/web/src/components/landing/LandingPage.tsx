import React from "react";
import {
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
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
        background: "var(--bg-canvas)",
        color: "var(--text-primary)",
        padding: "0 24px 80px",
      }}
    >
      {/* Top Navbar */}
      <nav
        style={{
          maxWidth: "1160px",
          margin: "0 auto 64px",
          padding: "20px 0",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--color-primary-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Terminal size={15} />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-deep-navy)" }}>
            Skill<span style={{ color: "var(--color-primary-blue)" }}>Twin</span>
          </span>
          <Badge variant="neutral">Developer Career Intelligence</Badge>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="outline" size="sm" onClick={onLoadSample} icon={<Layers size={13} />}>
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
          maxWidth: "920px",
          margin: "0 auto 64px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "9999px",
            background: "var(--color-light-blue)",
            border: "1px solid #bfdbfe",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-primary-blue)",
            marginBottom: "20px",
          }}
        >
          <ShieldCheck size={13} /> Evidence-First Career Intelligence
        </div>

        <h1
          style={{
            fontSize: "clamp(34px, 5.5vw, 56px)",
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            color: "var(--color-deep-navy)",
            marginBottom: "20px",
          }}
        >
          Stop guessing your readiness. <br />
          <span style={{ color: "var(--color-primary-blue)" }}>
            Quantify your actual skills with evidence.
          </span>
        </h1>

        <p
          style={{
            fontSize: "17px",
            color: "var(--text-secondary)",
            maxWidth: "680px",
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}
        >
          SkillTwin ingests your developer resume, extracts claimed versus demonstrated technical
          skills, benchmarks them against target job descriptions, and provides structured,
          non-hallucinatory career guidance.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <Button
            variant="primary"
            size="lg"
            onClick={onEnterApp}
            icon={<ArrowRight size={15} />}
            style={{ padding: "12px 24px", fontSize: "14px" }}
          >
            Analyze My Career Data
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onLoadSample}
            icon={<Layers size={15} />}
            style={{ padding: "12px 22px", fontSize: "14px" }}
          >
            Load Realistic Demo Profile
          </Button>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section
        style={{
          maxWidth: "1160px",
          margin: "0 auto 56px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        <div className="twin-panel">
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              background: "var(--color-light-blue)",
              color: "var(--color-primary-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <Code2 size={18} />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", color: "var(--color-deep-navy)" }}>
            Claimed vs. Demonstrated Skills
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
            Anyone can write "Docker" or "Testing" in a skills list. SkillTwin inspects your actual
            project bullets, architecture, and codebase evidence to establish honest proficiency.
          </p>
        </div>

        <div className="twin-panel">
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              background: "var(--color-match-bg)",
              color: "var(--color-match)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <GitCompare size={18} />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", color: "var(--color-deep-navy)" }}>
            Deterministic 5-Tier Gap Engine
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
            Categorizes requirements into <strong>Critical Gaps</strong>, <strong>Partial Gaps</strong>,{" "}
            <strong>Weak Evidence</strong>, <strong>Matches</strong>, and <strong>Optional</strong>.
            Transparent logic rather than opaque scoring.
          </p>
        </div>

        <div className="twin-panel">
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              background: "var(--color-partial-bg)",
              color: "var(--color-partial)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
            }}
          >
            <FileSearch size={18} />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", color: "var(--color-deep-navy)" }}>
            Zero-Hallucination Optimization
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
            Never invents fake metrics or unpracticed technologies. Offers grounded bullet
            enhancements and explicitly notes when evidence is required.
          </p>
        </div>
      </section>

      {/* Interactive Micro-Preview */}
      <section
        style={{
          maxWidth: "1160px",
          margin: "0 auto",
          background: "var(--bg-canvas)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-deep-navy)" }}>Live Intelligence Preview</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Sample Profile: Alex Rivera vs Senior Full Stack Engineer JD
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onLoadSample}>
            View Full Analysis
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          <div style={{ padding: "14px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-primary)" }}>React.js</span>
              <Badge variant="match">MATCH • Strong</Badge>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
              ✓ Listed in resume • Used in 2 major production projects • Component architecture demonstrated.
            </p>
          </div>

          <div style={{ padding: "14px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-primary)" }}>Docker</span>
              <Badge variant="gap">CRITICAL GAP</Badge>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
              ⚠ Listed in skills list; production container configuration or Dockerfiles not demonstrated.
            </p>
          </div>

          <div style={{ padding: "14px", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-primary)" }}>Automated Testing</span>
              <Badge variant="gap">NOT DEMONSTRATED</Badge>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
              ✗ Required for Senior role; unit or integration test suites not demonstrated in candidate evidence.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
