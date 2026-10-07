import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Code2,
  Boxes,
  Cpu,
  Layers,
  Search,
  Filter,
  RefreshCw,
  FolderGit2,
  CheckCheck,
  FileText,
  Lock,
  ArrowRight,
  Info,
  Server,
} from "lucide-react";
import type {
  GithubEvidenceReport,
  AnalyzedRepository,
  SkillEvidenceComparison,
  ResumeExtraction,
  SkillMatrix,
} from "@skilltwin/contracts";
import type { ActiveScreen } from "../../types/navigation.js";

interface EvidencePageViewProps {
  report: GithubEvidenceReport | null;
  repositories: AnalyzedRepository[];
  resume: ResumeExtraction | null;
  matrix: SkillMatrix | null;
  username: string;
  token?: string;
  onConnect: (username: string, token?: string) => Promise<void>;
  onNavigate: (screen: ActiveScreen) => void;
  isLoading?: boolean;
}

type FilterTab = "all" | "verified" | "discrepancies" | "github_only";

export const EvidencePageView: React.FC<EvidencePageViewProps> = ({
  report,
  repositories,
  resume,
  username: initialUsername,
  token: initialToken = "",
  onConnect,
  onNavigate,
  isLoading = false,
}) => {
  const [usernameInput, setUsernameInput] = useState(initialUsername || "");
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const handleSubmitConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    onConnect(usernameInput.trim(), tokenInput.trim() || undefined);
  };

  // Filter comparisons
  const filteredComparisons = useMemo(() => {
    if (!report?.comparisons) return [];
    return report.comparisons.filter((item) => {
      // Tab filter
      if (filterTab === "verified" && item.status !== "VERIFIED" && item.status !== "PARTIAL_MATCH" && (item.status as any) !== "verified_match") return false;
      if (filterTab === "discrepancies" && item.status !== "DISCREPANCY" && (item.status as any) !== "discrepancy") return false;
      if (filterTab === "github_only" && item.status !== "GITHUB_ONLY" && (item.status as any) !== "github_only") return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.canonicalName.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesResumeDetail = item.resumeEvidenceDetail.toLowerCase().includes(query);
        const matchesGithubDetail = item.githubEvidenceDetail.toLowerCase().includes(query);
        return matchesName || matchesCategory || matchesResumeDetail || matchesGithubDetail;
      }

      return true;
    });
  }, [report, filterTab, searchQuery]);

  const activeRepoObj = useMemo(() => {
    if (!selectedRepo) return null;
    return repositories.find((r) => r.name === selectedRepo) || null;
  }, [repositories, selectedRepo]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in" data-testid="evidence-page">
      {/* 1. Header Banner */}
      <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 bg-blue-50 text-brand-blue rounded-lg border border-blue-100">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-content-primary">
                  Evidence Verification & GitHub Integration
                </h1>
                <p className="text-sm text-content-secondary">
                  Corroborate technical resume claims against authentic repository evidence via authorized GitHub REST API.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Authorized API Mode (No Scraping)
            </span>
          </div>
        </div>

        {/* Connection Form */}
        <form onSubmit={handleSubmitConnect} className="mt-6 pt-5 border-t border-border-subtle">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1.5">
                GitHub Username or Organization
              </label>
              <div className="relative">
                <GitBranch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter GitHub username..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                  data-testid="github-username-input"
                />
              </div>
            </div>

            {showTokenInput && (
              <div className="flex-1">
                <label className="block text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1.5">
                  Personal Access Token (Optional)
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" />
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_... (for private repos or rate limits)"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isLoading || !usernameInput.trim()}
                className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                data-testid="github-connect-btn"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <FolderGit2 size={16} />
                    <span>Connect & Verify</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowTokenInput((prev) => !prev)}
                className="px-3 py-2 border border-border-subtle hover:bg-surface-subtle text-content-secondary text-sm font-medium rounded-lg transition-colors"
                title="Configure authorized token for private repositories"
              >
                {showTokenInput ? "Hide PAT" : "Add Token"}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-content-tertiary">
            <Info size={13} className="shrink-0 text-blue-500" />
            <span>
              SkillTwin queries GitHub's official REST API endpoint (<code>/users/{usernameInput || "username"}/repos</code>). Your token is never stored and pages are never scraped.
            </span>
          </div>
        </form>
      </div>

      {/* Discrepancy Callouts (Non-accusatory notice as strictly requested) */}
      {report && report.discrepancies && report.discrepancies.length > 0 && (
        <div className="space-y-3" data-testid="discrepancy-callout-container">
          {report.discrepancies.map((disc) => (
            <div
              key={disc.canonicalName}
              className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 md:p-5 shadow-sm"
              data-testid={`discrepancy-${disc.canonicalName.toLowerCase()}`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-amber-900 text-base">
                      {disc.canonicalName}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-medium">
                      Evidence Verification Notice
                    </span>
                  </div>

                  {/* Strictly compliant phrasing: "[Skill] is listed on your resume, but current connected evidence does not demonstrate it." */}
                  <p className="text-sm font-medium text-amber-950 mt-1" data-testid="discrepancy-message">
                    {disc.discrepancyMessage ||
                      `${disc.canonicalName} is listed on your resume, but current connected evidence does not demonstrate it.`}
                  </p>

                  <div className="mt-3 p-3 bg-white/80 border border-amber-200/70 rounded-lg text-xs text-amber-900 space-y-1">
                    <p>
                      <strong>Resume Status:</strong> {disc.resumeEvidenceDetail}
                    </p>
                    <p>
                      <strong>GitHub Status:</strong> {disc.githubEvidenceDetail}
                    </p>
                    {disc.recommendationTip && (
                      <p className="text-blue-900 pt-1 font-medium flex items-center gap-1.5">
                        <ArrowRight size={13} className="shrink-0 text-blue-600" />
                        <span>Actionable Tip: {disc.recommendationTip}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Executive KPI Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-content-tertiary mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Repositories</span>
              <FolderGit2 size={16} className="text-brand-blue" />
            </div>
            <div className="text-2xl font-bold text-content-primary" data-testid="stat-repos-count">
              {report.totalRepositories}
            </div>
            <div className="text-xs text-content-secondary mt-1">Analyzed via REST API</div>
          </div>

          <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-content-tertiary mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Verified Match</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700" data-testid="stat-verified-count">
              {report.summary.verifiedCount}
            </div>
            <div className="text-xs text-content-secondary mt-1">Confirmed in code & configs</div>
          </div>

          <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-content-tertiary mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Discrepancies</span>
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700" data-testid="stat-discrepancy-count">
              {report.summary.discrepancyCount}
            </div>
            <div className="text-xs text-content-secondary mt-1">Skills missing repo evidence</div>
          </div>

          <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-content-tertiary mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">GitHub Discoveries</span>
              <Code2 size={16} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-700" data-testid="stat-github-only-count">
              {report.summary.githubOnlyCount}
            </div>
            <div className="text-xs text-content-secondary mt-1">Found in repos, not on resume</div>
          </div>
        </div>
      )}

      {/* 3. Analyzed Repositories Showcase */}
      <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
              <Boxes size={20} className="text-brand-blue" />
              <span>Connected Repositories Evidence</span>
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Inspecting codebases, tests, Dockerfiles, and deployment configs for concrete evidence.
            </p>
          </div>
          <span className="text-xs font-mono text-content-tertiary bg-surface-subtle px-2.5 py-1 rounded border border-border-subtle">
            {repositories.length} Repositories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="repositories-grid">
          {repositories.map((repo) => (
            <div
              key={repo.name}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                selectedRepo === repo.name
                  ? "border-brand-blue bg-blue-50/30 shadow-sm"
                  : "border-border-subtle hover:border-slate-300 bg-white"
              }`}
              onClick={() => setSelectedRepo(selectedRepo === repo.name ? null : repo.name)}
              data-testid={`repo-card-${repo.name}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-sm text-brand-blue hover:underline flex items-center gap-1"
                >
                  <span>{repo.name}</span>
                  <ExternalLink size={12} className="opacity-60" />
                </a>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                    repo.activityLevel === "Active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {repo.activityLevel}
                </span>
              </div>

              <p className="text-xs text-content-secondary line-clamp-2 mb-3">
                {repo.description || "No repository description provided."}
              </p>

              {/* Languages bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[11px] font-medium text-content-secondary mb-1">
                  <span>{repo.primaryLanguage}</span>
                  <span>{repo.languages[0]?.percentage || 100}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  {repo.languages.map((lang, idx) => (
                    <div
                      key={lang.name}
                      style={{ width: `${lang.percentage}%` }}
                      className={`h-full ${
                        idx === 0
                          ? "bg-blue-600"
                          : idx === 1
                          ? "bg-sky-400"
                          : "bg-slate-400"
                      }`}
                      title={`${lang.name}: ${lang.percentage}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Signals badges */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border-subtle text-[11px]">
                {repo.docker.detected ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-medium"
                    data-testid={`repo-${repo.name}-docker-badge`}
                  >
                    <Server size={11} />
                    <span>Docker ({repo.docker.files?.length || 1})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 rounded font-medium">
                    No Docker
                  </span>
                )}

                {repo.testing.detected ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-medium"
                    data-testid={`repo-${repo.name}-tests-badge`}
                  >
                    <CheckCheck size={11} />
                    <span>Tests ({repo.testing.testFileCount})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 rounded font-medium">
                    No Tests
                  </span>
                )}

                {repo.deployment.detected && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded font-medium"
                    data-testid={`repo-${repo.name}-ci-badge`}
                  >
                    <Layers size={11} />
                    <span>{repo.deployment.platforms?.[0] || "CI/CD"}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Repo Details Drawer/Preview */}
        {activeRepoObj && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 animate-fade-in">
            <div className="flex justify-between items-center font-bold text-content-primary">
              <span className="flex items-center gap-1.5 text-sm">
                <FolderGit2 size={15} className="text-brand-blue" />
                <span>{activeRepoObj.fullName} — Evidence Details</span>
              </span>
              <button
                onClick={() => setSelectedRepo(null)}
                className="text-content-tertiary hover:text-content-primary"
              >
                Close
              </button>
            </div>
            <p className="text-content-secondary">
              <strong>README Summary:</strong> {activeRepoObj.readmeSummary}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              <div>
                <strong>Docker Evidence:</strong>{" "}
                {activeRepoObj.docker.detected
                  ? `Detected (${(activeRepoObj.docker.files || []).join(", ")})`
                  : "None detected"}
              </div>
              <div>
                <strong>Test Suite:</strong>{" "}
                {activeRepoObj.testing.detected
                  ? `${activeRepoObj.testing.frameworks.join(", ")} (${activeRepoObj.testing.testFileCount} test files)`
                  : "None detected"}
              </div>
              <div>
                <strong>CI/CD & Deployment:</strong>{" "}
                {activeRepoObj.deployment.detected
                  ? `${(activeRepoObj.deployment.platforms || []).join(", ")} (${activeRepoObj.deployment.configFiles.join(", ")})`
                  : "None detected"}
              </div>
            </div>
            <div className="pt-1">
              <strong>Dependencies detected:</strong>{" "}
              {activeRepoObj.dependencies.map((d) => `${d.name}@${d.version}`).join(", ")}
            </div>
          </div>
        )}
      </div>

      {/* 4. Cross-Verification Matrix (Resume vs GitHub) */}
      <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
              <CheckCheck size={20} className="text-brand-blue" />
              <span>Resume vs. GitHub Verification Matrix</span>
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Direct side-by-side comparison of skills claimed on your resume against concrete code found in your repositories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-surface-subtle border border-border-subtle rounded-lg text-xs font-medium">
              <button
                onClick={() => setFilterTab("all")}
                className={`px-3 py-1 rounded transition-colors ${
                  filterTab === "all" ? "bg-white text-content-primary shadow-xs font-semibold" : "text-content-secondary"
                }`}
              >
                All ({report?.comparisons.length || 0})
              </button>
              <button
                onClick={() => setFilterTab("verified")}
                className={`px-3 py-1 rounded transition-colors ${
                  filterTab === "verified" ? "bg-white text-emerald-700 shadow-xs font-semibold" : "text-content-secondary"
                }`}
              >
                Verified ({report?.summary.verifiedCount || 0})
              </button>
              <button
                onClick={() => setFilterTab("discrepancies")}
                className={`px-3 py-1 rounded transition-colors ${
                  filterTab === "discrepancies" ? "bg-white text-amber-700 shadow-xs font-semibold" : "text-content-secondary"
                }`}
              >
                Discrepancies ({report?.summary.discrepancyCount || 0})
              </button>
              <button
                onClick={() => setFilterTab("github_only")}
                className={`px-3 py-1 rounded transition-colors ${
                  filterTab === "github_only" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-content-secondary"
                }`}
              >
                GitHub Only ({report?.summary.githubOnlyCount || 0})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skill..."
                className="pl-8 pr-3 py-1 text-xs border border-border-subtle rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue bg-white w-36 md:w-44"
              />
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-border-subtle rounded-lg" data-testid="verification-matrix-table">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-border-subtle text-content-secondary uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Skill / Technology</th>
                <th className="py-3 px-4">Resume Evidence</th>
                <th className="py-3 px-4">GitHub Evidence</th>
                <th className="py-3 px-4">Project Evidence</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredComparisons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-content-tertiary">
                    No skills matched current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredComparisons.map((item) => (
                  <tr
                    key={item.canonicalName}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      item.status === "DISCREPANCY" ? "bg-amber-50/30" : ""
                    }`}
                    data-testid={`matrix-row-${item.canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  >
                    {/* 1. Skill Name */}
                    <td className="py-3 px-4 font-semibold text-content-primary">
                      <div className="flex items-center gap-2">
                        <span>{item.canonicalName}</span>
                        <span className="text-[10px] text-content-tertiary px-1.5 py-0.2 bg-slate-100 rounded">
                          {item.category}
                        </span>
                      </div>
                    </td>

                    {/* 2. Resume Evidence */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {item.resumeEvidence ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold" data-testid="resume-evidence-yes">
                            <CheckCircle2 size={13} />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-medium" data-testid="resume-evidence-no">
                            <span>No</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-content-secondary line-clamp-1 mt-0.5" title={item.resumeEvidenceDetail}>
                        {item.resumeEvidenceDetail}
                      </div>
                    </td>

                    {/* 3. GitHub Evidence */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {item.githubEvidence ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 font-semibold" data-testid="github-evidence-yes">
                            <GitBranch size={13} />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-medium" data-testid="github-evidence-no">
                            <span>No</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-content-secondary line-clamp-1 mt-0.5" title={item.githubEvidenceDetail}>
                        {item.githubEvidenceDetail}
                      </div>
                    </td>

                    {/* 4. Project Evidence */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.projectEvidence === "Strong"
                            ? "bg-blue-100 text-blue-800"
                            : item.projectEvidence === "Moderate"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                        data-testid="project-evidence-badge"
                      >
                        {item.projectEvidence}
                      </span>
                    </td>

                    {/* 5. Confidence */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.confidence === "High"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.confidence === "Moderate"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                        data-testid="confidence-badge"
                      >
                        {item.confidence}
                      </span>
                    </td>

                    {/* 6. Status Badge */}
                    <td className="py-3 px-4">
                      {(item.status === "VERIFIED" || (item.status as any) === "verified_match") && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Verified Match</span>
                        </span>
                      )}
                      {(item.status === "PARTIAL_MATCH" || (item.status as any) === "partial_match") && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-semibold text-[11px]">
                          <CheckCircle2 size={12} className="text-sky-600" />
                          <span>Partial Match</span>
                        </span>
                      )}
                      {(item.status === "DISCREPANCY" || (item.status as any) === "discrepancy") && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                          <AlertTriangle size={12} className="text-amber-600" />
                          <span>Discrepancy</span>
                        </span>
                      )}
                      {(item.status === "GITHUB_ONLY" || (item.status as any) === "github_only") && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold text-[11px]">
                          <Code2 size={12} className="text-indigo-600" />
                          <span>GitHub Discovery</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Recommended Next Action */}
      <div className="bg-slate-50 border border-border-subtle rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-semibold text-content-primary text-sm flex items-center gap-1.5">
            <Cpu size={16} className="text-brand-blue" />
            <span>Ready to convert missing evidence into production projects?</span>
          </div>
          <p className="text-xs text-content-secondary">
            Use the Project Recommendation Engine to architect custom repositories targeted at skills with unverified evidence.
          </p>
        </div>

        <button
          onClick={() => onNavigate("project_recommendations")}
          className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>View Recommended Projects</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
