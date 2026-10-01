import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { developerTwinSchema, type DeveloperTwin } from "@skilltwin/contracts";
import "./styles.css";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
type View = "overview" | "evidence" | "roadmap";

function useDemoTwin() {
  const [data, setData] = useState<DeveloperTwin | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    fetch(`${apiUrl}/api/v1/demo/twin`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load demo twin");
        return developerTwinSchema.parse(await response.json());
      })
      .then((twin) => {
        if (active) {
          setData(twin);
          setState("ready");
        }
      })
      .catch(() => active && setState("error"));
    return () => { active = false; };
  }, []);

  return { data, state };
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main className="landing">
      <header className="topbar">
        <strong className="brand">Skill<span>Twin</span></strong>
        <span className="nav-meta"><i className="status-dot" /> Evidence-first career intelligence</span>
      </header>
      <section className="hero">
        <p className="eyebrow">AI developer career intelligence</p>
        <h1>Your GitHub tells a story.<br /><em>SkillTwin connects it.</em></h1>
        <p className="lede">Build an evidence-based developer profile from your resume, projects, and real engineering activity.</p>
        <button className="primary-button" onClick={onStart}>Explore a Developer Twin <span>→</span></button>
      </section>
      <div className="principles">
        <span>01 <b>Evidence over claims</b></span>
        <span>02 <b>Explainable estimates</b></span>
        <span>03 <b>Practical next actions</b></span>
      </div>
    </main>
  );
}

function Dashboard({ twin, view, onView, onExit }: { twin: DeveloperTwin; view: View; onView: (view: View) => void; onExit: () => void }) {
  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <button className="brand brand-button" onClick={onExit}>Skill<span>Twin</span></button>
        <p className="sidebar-label">Developer Twin</p>
        <nav>
          {([["overview", "Overview"], ["evidence", "Evidence map"], ["roadmap", "Next actions"]] as const).map(([key, label]) => (
            <button className={view === key ? "nav-item active" : "nav-item"} onClick={() => onView(key)} key={key}>{label}</button>
          ))}
        </nav>
        <div className="sidebar-footer"><i className="status-dot" /> Demo data<br /><small>Replace with your sources</small></div>
      </aside>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div><p className="eyebrow">Overview · seeded data</p><h1>Good morning, Nikhil.</h1></div>
          <button className="outline-button" onClick={onExit}>Exit preview</button>
        </header>
        {view === "overview" && <Overview twin={twin} onView={onView} />}
        {view === "evidence" && <Evidence twin={twin} />}
        {view === "roadmap" && <Roadmap twin={twin} />}
      </section>
    </main>
  );
}

function Overview({ twin, onView }: { twin: DeveloperTwin; onView: (view: View) => void }) {
  return <><div className="stat-grid">
    <Stat label="Evidence confidence" value={`${twin.summary.evidenceConfidence}%`} detail="AI-generated estimate" />
    <Stat label="Sources connected" value={twin.summary.connectedSources.toString()} detail="Resume · GitHub" />
    <Stat label="Projects analyzed" value={twin.summary.projectsAnalyzed.toString()} detail="Meaningful activity" />
  </div>
  <section className="dashboard-grid">
    <div className="panel profile-card"><div className="avatar">{twin.profile.initials}</div><p className="eyebrow">Current profile</p><h2>{twin.profile.name}</h2><p className="muted">{twin.profile.headline} · {twin.profile.yearsOfEvidence} years of evidence</p><div className="profile-line"><span>Last analyzed</span><b>{twin.summary.lastAnalyzed}</b></div><button className="text-button" onClick={() => onView("evidence")}>Inspect evidence <span>→</span></button></div>
    <div className="panel skills-card"><div className="panel-title"><span>Demonstrated skills</span><button className="text-button" onClick={() => onView("evidence")}>Why these scores?</button></div>{twin.skills.map((skill) => <SkillRow key={skill.skill} skill={skill} />)}</div>
  </section>
  <section className="next-action"><div><p className="eyebrow">Recommended next action</p><h2>{twin.nextAction.title}</h2><p>{twin.nextAction.description}</p></div><button className="primary-button small" onClick={() => onView("roadmap")}>View action <span>→</span></button></section></>;
}

function Evidence({ twin }: { twin: DeveloperTwin }) {
  return <div><div className="page-intro"><p className="eyebrow">Explainability</p><h2>Why SkillTwin thinks you have these skills</h2><p className="muted">Every estimate is grounded in available source evidence. It is not an objective proficiency measurement.</p></div><div className="evidence-list">{twin.skills.map((skill) => <article className="panel evidence-item" key={skill.skill}><div><h3>{skill.skill} <span>{skill.confidenceEstimate}%</span></h3><p>{skill.explanation}</p></div><div className="evidence-tags">{skill.evidenceSources.map((source) => <span key={source}>{source}</span>)}</div><small>{skill.evidenceSummary}</small></article>)}</div></div>;
}

function Roadmap({ twin }: { twin: DeveloperTwin }) {
  return <div><div className="page-intro"><p className="eyebrow">Practical roadmap</p><h2>Build evidence, not just knowledge</h2><p className="muted">The next action is prioritized from your current evidence and target-role gaps.</p></div><section className="panel roadmap-card"><div className="roadmap-number">01</div><div><p className="eyebrow">Recommended project task · {twin.nextAction.skill}</p><h2>{twin.nextAction.title}</h2><p>{twin.nextAction.description}</p><div className="expected"><b>Expected new evidence</b><span>Test files</span><span>API documentation</span><span>Decision record</span></div></div></section></div>;
}

function SkillRow({ skill }: { skill: DeveloperTwin["skills"][number] }) {
  return <div className="skill-row"><div className="skill-label"><b>{skill.skill}</b><span>{skill.evidenceSummary}</span></div><div className="bar"><i style={{ width: `${skill.confidenceEstimate}%` }} /></div><strong>{skill.confidenceEstimate}</strong></div>;
}
function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="stat panel"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function App() {
  const [started, setStarted] = useState(false);
  const [view, setView] = useState<View>("overview");
  const { data, state } = useDemoTwin();
  if (!started) return <Landing onStart={() => setStarted(true)} />;
  if (state === "loading") return <main className="state-screen"><div className="loader" /><p>Loading your Developer Twin…</p></main>;
  if (state === "error" || !data) return <main className="state-screen"><h1>Demo data unavailable</h1><p>Start the API with <code>pnpm --filter @skilltwin/api dev</code> and try again.</p><button className="outline-button" onClick={() => setStarted(false)}>Back to landing</button></main>;
  return <Dashboard twin={data} view={view} onView={setView} onExit={() => { setStarted(false); setView("overview"); }} />;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
