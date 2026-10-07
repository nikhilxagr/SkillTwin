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
  FileText,
  Briefcase,
  BarChart2,
  FileCheck2,
} from "lucide-react";
import { Button } from "../common/Button.js";
import { Badge } from "../common/Badge.js";

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary w-full max-w-full overflow-x-hidden px-4 sm:px-6 pb-20">
      {/* Top Navbar */}
      <nav className="max-w-6xl mx-auto mb-10 md:mb-16 py-4 md:py-5 border-b border-border-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-7 h-7 rounded bg-brand-blue flex items-center justify-center text-white shrink-0">
            <Terminal size={15} />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-brand-navy shrink-0">
            Skill<span className="text-brand-blue">Twin</span>
          </span>
          <span className="hidden lg:inline-flex">
            <Badge variant="neutral">Developer Career Intelligence</Badge>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onEnterApp}
            className="px-2.5 sm:px-3 text-xs sm:text-sm"
          >
            Sign In
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onEnterApp}
            className="px-3 sm:px-4 text-xs sm:text-sm"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto mb-12 md:mb-16 text-center px-1 sm:px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light border border-blue-200 text-xs font-semibold text-brand-blue mb-4 sm:mb-5">
          <ShieldCheck size={13} className="shrink-0" />
          <span>Evidence-First Career Intelligence</span>
        </div>

        <div className="text-[11px] sm:text-xs uppercase tracking-widest font-bold text-content-secondary mb-2">
          SkillTwin
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-brand-navy mb-4 leading-tight break-words">
          Understand your skills. <br className="hidden sm:inline" />
          <span className="text-brand-blue">Match them to the right opportunities.</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-content-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
          Quantify your actual skills with evidence. SkillTwin evaluates claimed versus demonstrated
          technical abilities, benchmarks them against real job descriptions, and gives you transparent,
          non-hallucinatory guidance.
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="lg"
            onClick={onEnterApp}
            icon={<ArrowRight size={15} />}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold justify-center"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Simple Product Workflow */}
      <section className="max-w-6xl mx-auto mb-16 md:mb-20">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-content-secondary mb-1">
            Product Workflow
          </h2>
          <p className="text-lg sm:text-xl font-bold text-brand-navy">
            How SkillTwin Evaluates Career Readiness
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Step 1: Resume */}
          <div className="bg-surface-canvas border border-border-subtle rounded-lg p-5 flex flex-col justify-between shadow-subtle hover:border-brand-blue transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-brand-blue bg-brand-light px-2 py-0.5 rounded">
                  01
                </span>
                <FileText size={16} className="text-content-secondary" />
              </div>
              <h3 className="font-bold text-base text-brand-navy mb-1">Resume</h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Ingest technical resume and extract claimed projects, roles, and competencies.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-content-muted flex items-center justify-between">
              <span>Evidence parsing</span>
              <ArrowRight size={12} className="hidden lg:inline text-border-strong" />
            </div>
          </div>

          {/* Step 2: Skills */}
          <div className="bg-surface-canvas border border-border-subtle rounded-lg p-5 flex flex-col justify-between shadow-subtle hover:border-brand-blue transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-brand-blue bg-brand-light px-2 py-0.5 rounded">
                  02
                </span>
                <BarChart2 size={16} className="text-content-secondary" />
              </div>
              <h3 className="font-bold text-base text-brand-navy mb-1">Skills</h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Map aliases to canonical taxonomy and verify corroborating implementation proof.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-content-muted flex items-center justify-between">
              <span>Skill Matrix</span>
              <ArrowRight size={12} className="hidden lg:inline text-border-strong" />
            </div>
          </div>

          {/* Step 3: Job */}
          <div className="bg-surface-canvas border border-border-subtle rounded-lg p-5 flex flex-col justify-between shadow-subtle hover:border-brand-blue transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-brand-blue bg-brand-light px-2 py-0.5 rounded">
                  03
                </span>
                <Briefcase size={16} className="text-content-secondary" />
              </div>
              <h3 className="font-bold text-base text-brand-navy mb-1">Job</h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Extract required vs. preferred skills and technical responsibilities from target JD.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-content-muted flex items-center justify-between">
              <span>Requirements</span>
              <ArrowRight size={12} className="hidden lg:inline text-border-strong" />
            </div>
          </div>

          {/* Step 4: Gaps */}
          <div className="bg-surface-canvas border border-border-subtle rounded-lg p-5 flex flex-col justify-between shadow-subtle hover:border-brand-blue transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-brand-blue bg-brand-light px-2 py-0.5 rounded">
                  04
                </span>
                <GitCompare size={16} className="text-content-secondary" />
              </div>
              <h3 className="font-bold text-base text-brand-navy mb-1">Gaps</h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Run deterministic 5-tier classification to pinpoint critical, partial, and optional gaps.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-content-muted flex items-center justify-between">
              <span>5-Tier Analysis</span>
              <ArrowRight size={12} className="hidden lg:inline text-border-strong" />
            </div>
          </div>

          {/* Step 5: Recommendations */}
          <div className="bg-surface-canvas border border-border-subtle rounded-lg p-5 flex flex-col justify-between shadow-subtle hover:border-brand-blue transition-colors sm:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-brand-blue bg-brand-light px-2 py-0.5 rounded">
                  05
                </span>
                <FileCheck2 size={16} className="text-brand-blue" />
              </div>
              <h3 className="font-bold text-base text-brand-navy mb-1">Recommendations</h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Generate truthful bullet enhancements without fabricated claims or fictional metrics.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-content-muted flex items-center justify-between">
              <span>Truth-Checked</span>
              <CheckCircle2 size={12} className="text-status-success" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-6xl mx-auto mb-16 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="twin-panel bg-surface-canvas border border-border-subtle p-5">
          <div className="w-9 h-9 rounded bg-brand-light text-brand-blue flex items-center justify-center mb-3">
            <Code2 size={18} />
          </div>
          <h3 className="text-base font-bold mb-1.5 text-brand-navy">
            Claimed vs. Demonstrated Skills
          </h3>
          <p className="text-xs text-content-secondary leading-relaxed">
            Anyone can write "Docker" or "Testing" in a skills list. SkillTwin inspects your actual
            project bullets, architecture, and codebase evidence to establish honest proficiency.
          </p>
        </div>

        <div className="twin-panel bg-surface-canvas border border-border-subtle p-5">
          <div className="w-9 h-9 rounded bg-status-success/10 text-status-success flex items-center justify-center mb-3">
            <GitCompare size={18} />
          </div>
          <h3 className="text-base font-bold mb-1.5 text-brand-navy">
            Deterministic 5-Tier Gap Engine
          </h3>
          <p className="text-xs text-content-secondary leading-relaxed">
            Categorizes requirements into <strong>Critical Gaps</strong>, <strong>Partial Gaps</strong>,{" "}
            <strong>Weak Evidence</strong>, <strong>Matches</strong>, and <strong>Optional</strong>.
            Transparent logic rather than opaque scoring.
          </p>
        </div>

        <div className="twin-panel bg-surface-canvas border border-border-subtle p-5">
          <div className="w-9 h-9 rounded bg-status-warning/10 text-status-warning flex items-center justify-center mb-3">
            <FileSearch size={18} />
          </div>
          <h3 className="text-base font-bold mb-1.5 text-brand-navy">
            Zero-Hallucination Optimization
          </h3>
          <p className="text-xs text-content-secondary leading-relaxed">
            Never invents fake metrics or unpracticed technologies. Offers grounded bullet
            enhancements and explicitly notes when evidence is required.
          </p>
        </div>
      </section>

      {/* Interactive Micro-Preview */}
      <section className="max-w-6xl mx-auto bg-surface-canvas border border-border-subtle rounded-lg p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h4 className="text-base font-bold text-brand-navy">Evidence Assessment Framework</h4>
            <p className="text-xs text-content-secondary">
              Deterministic skill matching and critical gap identification
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onEnterApp} className="w-full sm:w-auto justify-center">
            Analyze Your Resume
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-surface-subtle rounded border border-border-subtle">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-xs text-content-primary">React.js</span>
              <Badge variant="match">MATCH • Strong</Badge>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              ✓ Listed in resume • Used in 2 major production projects • Component architecture demonstrated.
            </p>
          </div>

          <div className="p-3.5 bg-surface-subtle rounded border border-border-subtle">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-xs text-content-primary">Docker</span>
              <Badge variant="gap">CRITICAL GAP</Badge>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              ⚠ Listed in skills list; production container configuration or Dockerfiles not demonstrated.
            </p>
          </div>

          <div className="p-3.5 bg-surface-subtle rounded border border-border-subtle">
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-semibold text-xs text-content-primary">Automated Testing</span>
              <Badge variant="gap">NOT DEMONSTRATED</Badge>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              ✗ Required for Senior role; unit or integration test suites not demonstrated in candidate evidence.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
