import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const skills = [
  { name: "React", score: 78, evidence: "4 repositories · Hooks · Components" },
  { name: "TypeScript", score: 64, evidence: "3 repositories · Typed APIs" },
  { name: "Node.js", score: 58, evidence: "2 repositories · REST services" },
];

function App() {
  return (
    <main className="shell">
      <nav className="nav">
        <strong className="brand">Skill<span>Twin</span></strong>
        <div className="nav-meta">
          <span className="status-dot" /> Demo workspace
        </div>
      </nav>

      <section className="hero">
        <p className="eyebrow">AI developer career intelligence</p>
        <h1>Your GitHub tells a story.<br /><em>SkillTwin connects it.</em></h1>
        <p className="lede">
          Build an evidence-based developer profile from your resume, projects, and real engineering activity.
        </p>
        <button className="primary-button">Create your Developer Twin <span>→</span></button>
      </section>

      <section className="twin-preview" aria-label="Developer Twin preview">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Preview · seeded data</p>
            <h2>Developer Twin</h2>
          </div>
          <span className="confidence">Evidence confidence · 72%</span>
        </div>
        <div className="content-grid">
          <div className="profile-panel">
            <div className="avatar">NX</div>
            <h3>Nikhil's developer profile</h3>
            <p>Full Stack Developer · 3 years of evidence</p>
            <div className="profile-line"><span>Sources connected</span><b>2</b></div>
            <div className="profile-line"><span>Projects analyzed</span><b>6</b></div>
            <div className="profile-line"><span>Last analyzed</span><b>Today</b></div>
          </div>
          <div className="skills-panel">
            <div className="panel-title"><span>Top demonstrated skills</span><span className="muted">Why this score?</span></div>
            {skills.map((skill) => (
              <div className="skill-row" key={skill.name}>
                <div className="skill-label"><b>{skill.name}</b><span>{skill.evidence}</span></div>
                <div className="bar"><i style={{ width: `${skill.score}%` }} /></div>
                <strong>{skill.score}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
