import { describe, expect, it } from "vitest";
import { skillNormalizer, skillRegistry, confidenceEvaluator, skillMatrixService } from "../index.js";

describe("Phase 3: Normalized Skill Engine", () => {
  describe("1. Canonical Alias Resolution", () => {
    it("recognizes React, React.js, ReactJS, and reactjs as canonical 'React'", () => {
      const inputs = ["React", "React.js", "ReactJS", "react-js", "reactjs", "React.JS", "React-DOM"];
      for (const input of inputs) {
        const match = skillNormalizer.normalizeSkill(input);
        expect(match).not.toBeNull();
        expect(match?.canonicalName).toBe("React");
        expect(match?.category).toBe("Frontend");
      }
    });

    it("evaluates equivalence correctly with areSkillsEquivalent", () => {
      expect(skillNormalizer.areSkillsEquivalent("React", "React.js")).toBe(true);
      expect(skillNormalizer.areSkillsEquivalent("ReactJS", "reactjs")).toBe(true);
      expect(skillNormalizer.areSkillsEquivalent("Node", "Node.js")).toBe(true);
      expect(skillNormalizer.areSkillsEquivalent("K8s", "Kubernetes")).toBe(true);
      expect(skillNormalizer.areSkillsEquivalent("Postgres", "PostgreSQL")).toBe(true);
      expect(skillNormalizer.areSkillsEquivalent("React", "Angular")).toBe(false);
    });

    it("resolves common technology aliases accurately", () => {
      const cases: Array<{ inputs: string[]; expectedCanonical: string; category: string }> = [
        { inputs: ["Node", "Node.js", "NodeJS", "nodejs", "node.js"], expectedCanonical: "Node.js", category: "Backend" },
        { inputs: ["Postgres", "PostgreSQL", "psql", "postgresql"], expectedCanonical: "PostgreSQL", category: "Databases" },
        { inputs: ["K8s", "Kubernetes", "k8s", "kubernetes"], expectedCanonical: "Kubernetes", category: "Cloud/DevOps" },
        { inputs: ["TS", "TypeScript", "typescript"], expectedCanonical: "TypeScript", category: "Languages" },
        { inputs: ["JS", "JavaScript", "ES6", "ES6+"], expectedCanonical: "JavaScript", category: "Languages" },
        { inputs: ["Docker", "Containerization", "Containers"], expectedCanonical: "Docker", category: "Cloud/DevOps" },
        { inputs: ["Golang", "golang", "Go Lang"], expectedCanonical: "Go", category: "Languages" },
        { inputs: ["Py", "Python3", "python"], expectedCanonical: "Python", category: "Languages" },
        { inputs: ["AWS", "Amazon Web Services", "AWS Cloud"], expectedCanonical: "AWS", category: "Cloud/DevOps" },
        { inputs: ["GCP", "Google Cloud Platform", "Google Cloud"], expectedCanonical: "Google Cloud Platform", category: "Cloud/DevOps" },
        { inputs: ["Vue", "Vue.js", "VueJS", "Vue 3", "vuejs"], expectedCanonical: "Vue.js", category: "Frontend" },
        { inputs: ["Next", "Next.js", "NextJS", "nextjs"], expectedCanonical: "Next.js", category: "Frontend" },
        { inputs: ["Tailwind", "TailwindCSS", "tailwindcss"], expectedCanonical: "Tailwind CSS", category: "Frontend" },
        { inputs: ["TF", "Terraform", "Infrastructure as Code"], expectedCanonical: "Terraform", category: "Cloud/DevOps" },
        { inputs: ["C++", "CPP", "c plus plus"], expectedCanonical: "C++", category: "Languages" },
        { inputs: ["C#", "CSharp", "c-sharp", "c sharp"], expectedCanonical: "C#", category: "Languages" },
        { inputs: ["JWT", "JSON Web Token", "JSON Web Tokens"], expectedCanonical: "JWT Authentication", category: "Cybersecurity" },
      ];

      for (const testCase of cases) {
        for (const input of testCase.inputs) {
          const match = skillNormalizer.normalizeSkill(input);
          expect(match, `Expected input '${input}' to resolve`).not.toBeNull();
          expect(match?.canonicalName).toBe(testCase.expectedCanonical);
          expect(match?.category).toBe(testCase.category);
        }
      }
    });
  });

  describe("2. Deduplication and List Normalization", () => {
    it("deduplicates aliases into a single canonical skill entry", () => {
      const mixedList = [
        "React",
        "React.js",
        "ReactJS",
        "Node.js",
        "NodeJS",
        "TypeScript",
        "TS",
        "PostgreSQL",
        "Postgres",
        "Docker",
        "Containerization",
      ];

      const result = skillNormalizer.normalizeSkillList(mixedList);
      const canonicalNames = result.matches.map((m: { canonicalName: string }) => m.canonicalName);

      expect(canonicalNames).toHaveLength(5);
      expect(canonicalNames).toContain("React");
      expect(canonicalNames).toContain("Node.js");
      expect(canonicalNames).toContain("TypeScript");
      expect(canonicalNames).toContain("PostgreSQL");
      expect(canonicalNames).toContain("Docker");
    });
  });

  describe("3. System Extensibility", () => {
    it("allows dynamic registration of custom canonical skills", () => {
      skillRegistry.registerSkill({
        id: "runtime-bun",
        canonicalName: "Bun",
        category: "Backend",
        aliases: ["BunJS", "bun-runtime", "Bun.js"],
        description: "Fast all-in-one JavaScript runtime & toolkit.",
        ecosystemPartners: ["TypeScript", "React"],
        evidenceExpectations: ["High-speed package management or HTTP server execution"],
      });

      const match = skillNormalizer.normalizeSkill("BunJS");
      expect(match).not.toBeNull();
      expect(match?.canonicalName).toBe("Bun");
      expect(match?.category).toBe("Backend");
      expect(skillNormalizer.areSkillsEquivalent("Bun", "bun-runtime")).toBe(true);
    });

    it("allows dynamic registration of new aliases on existing skills", () => {
      skillRegistry.registerAlias("React", "React-Web-Library");
      const match = skillNormalizer.normalizeSkill("React-Web-Library");
      expect(match).not.toBeNull();
      expect(match?.canonicalName).toBe("React");
    });
  });

  describe("4. Confidence and Evidence Model", () => {
    const reactDef = skillRegistry.getSkill("React")!;

    it("scores a skill as 'ClaimedOnly' when no projects or experience are cited", () => {
      const evaluation = confidenceEvaluator.evaluate({
        canonicalSkill: reactDef,
        isClaimed: true,
        projectCorroborations: [],
        experienceCorroborations: [],
        allDetectedSkills: new Set(["react"]),
      });

      expect(evaluation.evidenceLevel).toBe("ClaimedOnly");
      expect(evaluation.confidence).toBeLessThan(50);
      expect(evaluation.proficiency).toBe("Weak");
      expect(evaluation.missingEvidence.length).toBeGreaterThan(0);
      expect(evaluation.missingEvidence.some((m) => m.includes("project") || m.includes("repository"))).toBe(true);
    });

    it("scores a skill as 'Demonstrated' and 'Strong' with rich commercial and project proof", () => {
      const evaluation = confidenceEvaluator.evaluate({
        canonicalSkill: reactDef,
        isClaimed: true,
        projectCorroborations: [
          {
            projectName: "Enterprise Dashboard",
            bulletMentions: ["Architected component state in React and Next.js reducing latency by 45%."],
            inTechList: true,
          },
        ],
        experienceCorroborations: [
          {
            company: "TechCorp",
            role: "Senior Frontend Engineer",
            bulletMentions: ["Spearheaded design system migration to React and TypeScript."],
            inTechList: true,
            isCurrent: true,
          },
        ],
        allDetectedSkills: new Set(["react", "typescript", "next.js", "automated testing"]),
      });

      expect(evaluation.evidenceLevel).toBe("Demonstrated");
      expect(evaluation.confidence).toBeGreaterThanOrEqual(80);
      expect(evaluation.proficiency).toBe("Strong");
      expect(evaluation.evidence.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("5. SkillMatrixService Integration with Normalization", () => {
    it("consolidates duplicate alias inputs in resume extraction into canonical matrix items", () => {
      const matrix = skillMatrixService.generateMatrix(
        "res-123",
        {
          profile: { name: "Test Candidate" },
          categorizedSkills: {
            programmingLanguages: ["TypeScript", "TS", "JavaScript", "JS"],
            frameworks: ["React", "React.js", "ReactJS", "Node.js", "NodeJS"],
            libraries: ["Tailwind CSS", "Tailwind"],
            databases: ["PostgreSQL", "Postgres"],
            tools: ["Docker", "Containerization"],
            cloudDevOps: ["Kubernetes", "K8s"],
            cybersecurity: ["JWT", "JWT Authentication"],
            softSkills: ["Mentorship", "Technical Mentorship"],
            otherTechnical: [],
          },
          projects: [
            {
              name: "SkillTwin Platform",
              technologies: ["React.js", "TypeScript", "Docker"],
              bullets: ["Engineered responsive UI using React.js and Tailwind CSS."],
            },
          ],
          experience: [
            {
              company: "Innovate Inc.",
              role: "Full Stack Engineer",
              current: true,
              technologies: ["ReactJS", "NodeJS", "Postgres"],
              bullets: ["Maintained microservices with Node.js and PostgreSQL database queries."],
            },
          ],
          education: [],
          certifications: [],
          achievements: [],
        },
        ["React", "React.js", "ReactJS", "Node.js", "Postgres"]
      );

      // Verify that React is canonicalized with no duplicate "React.js" or "ReactJS" matrix rows
      const reactItems = matrix.items.filter((i) => i.canonicalName === "React");
      expect(reactItems).toHaveLength(1);
      expect(reactItems[0].aliases).toContain("React.js");
      expect(reactItems[0].aliases).toContain("ReactJS");
      expect(reactItems[0].evidenceLevel).toBe("Demonstrated");

      // Verify Node.js canonicalization
      const nodeItems = matrix.items.filter((i) => i.canonicalName === "Node.js");
      expect(nodeItems).toHaveLength(1);
      expect(nodeItems[0].evidenceLevel).toBe("Demonstrated");

      // Verify PostgreSQL canonicalization
      const pgItems = matrix.items.filter((i) => i.canonicalName === "PostgreSQL");
      expect(pgItems).toHaveLength(1);

      // Verify matrix summary
      expect(matrix.summary.demonstratedCount).toBeGreaterThan(0);
      expect(matrix.summary.totalSkills).toBeGreaterThan(0);
    });
  });
});
