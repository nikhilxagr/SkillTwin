import type { IAIProvider } from "./ai-provider.interface.js";
import { aiResumeExtractionSchema, type AIResumeExtraction } from "./ai-response.schema.js";
import { deterministicJobParser } from "../modules/job/deterministic-job.parser.js";
import type { AIJobExtraction } from "../modules/job/job.schema.js";

interface TechDictionary {
  category: keyof AIResumeExtraction["categorizedSkills"];
  pattern: RegExp;
  canonical: string;
}

const TECH_CATALOG: TechDictionary[] = [
  // Programming Languages
  { category: "programmingLanguages", pattern: /\b(javascript|js|es6\+?)\b/i, canonical: "JavaScript" },
  { category: "programmingLanguages", pattern: /\b(typescript|ts)\b/i, canonical: "TypeScript" },
  { category: "programmingLanguages", pattern: /\bpython\b/i, canonical: "Python" },
  { category: "programmingLanguages", pattern: /\bjava\b/i, canonical: "Java" },
  { category: "programmingLanguages", pattern: /\b(c\+\+|cpp)\b/i, canonical: "C++" },
  { category: "programmingLanguages", pattern: /\bgolang|(?:\bgo\b(?!\s*to))\b/i, canonical: "Go" },
  { category: "programmingLanguages", pattern: /\brust\b/i, canonical: "Rust" },
  { category: "programmingLanguages", pattern: /\bruby\b/i, canonical: "Ruby" },
  { category: "programmingLanguages", pattern: /\bphp\b/i, canonical: "PHP" },
  { category: "programmingLanguages", pattern: /\bswift\b/i, canonical: "Swift" },
  { category: "programmingLanguages", pattern: /\bkotlin\b/i, canonical: "Kotlin" },
  { category: "programmingLanguages", pattern: /\bhtml5?\b/i, canonical: "HTML5" },
  { category: "programmingLanguages", pattern: /\bcss3?\b/i, canonical: "CSS3" },
  { category: "programmingLanguages", pattern: /\bsql\b/i, canonical: "SQL" },
  { category: "programmingLanguages", pattern: /\bbash|shell\b/i, canonical: "Shell" },
  { category: "programmingLanguages", pattern: /\bc#\b/i, canonical: "C#" },

  // Frameworks
  { category: "frameworks", pattern: /\breact(?:\.js|js)?\b/i, canonical: "React" },
  { category: "frameworks", pattern: /\bnext(?:\.js|js)?\b/i, canonical: "Next.js" },
  { category: "frameworks", pattern: /\bvue(?:\.js|js)?\b/i, canonical: "Vue.js" },
  { category: "frameworks", pattern: /\bangular\b/i, canonical: "Angular" },
  { category: "frameworks", pattern: /\bnode(?:\.js|js)?\b/i, canonical: "Node.js" },
  { category: "frameworks", pattern: /\bexpress(?:\.js|js)?\b/i, canonical: "Express.js" },
  { category: "frameworks", pattern: /\bnest(?:\.js|js)?\b/i, canonical: "NestJS" },
  { category: "frameworks", pattern: /\bdjango\b/i, canonical: "Django" },
  { category: "frameworks", pattern: /\bfastapi\b/i, canonical: "FastAPI" },
  { category: "frameworks", pattern: /\bflask\b/i, canonical: "Flask" },
  { category: "frameworks", pattern: /\bspring(?:\s*boot)?\b/i, canonical: "Spring Boot" },
  { category: "frameworks", pattern: /\bsvelte\b/i, canonical: "Svelte" },

  // Libraries
  { category: "libraries", pattern: /\bredux(?:\s*toolkit)?\b/i, canonical: "Redux" },
  { category: "libraries", pattern: /\btailwind(?:\s*css)?\b/i, canonical: "Tailwind CSS" },
  { category: "libraries", pattern: /\baxios\b/i, canonical: "Axios" },
  { category: "libraries", pattern: /\bmongoose\b/i, canonical: "Mongoose" },
  { category: "libraries", pattern: /\bprisma\b/i, canonical: "Prisma" },
  { category: "libraries", pattern: /\bzod\b/i, canonical: "Zod" },
  { category: "libraries", pattern: /\bpandas\b/i, canonical: "Pandas" },
  { category: "libraries", pattern: /\bnumpy\b/i, canonical: "NumPy" },
  { category: "libraries", pattern: /\breact\s*router\b/i, canonical: "React Router" },
  { category: "libraries", pattern: /\bgraphql\b/i, canonical: "GraphQL" },

  // Databases
  { category: "databases", pattern: /\bmongodb|mongo\b/i, canonical: "MongoDB" },
  { category: "databases", pattern: /\bpostgresql|postgres\b/i, canonical: "PostgreSQL" },
  { category: "databases", pattern: /\bmysql\b/i, canonical: "MySQL" },
  { category: "databases", pattern: /\bredis\b/i, canonical: "Redis" },
  { category: "databases", pattern: /\bsqlite\b/i, canonical: "SQLite" },
  { category: "databases", pattern: /\bdynamodb\b/i, canonical: "DynamoDB" },
  { category: "databases", pattern: /\bfirebase\b/i, canonical: "Firebase" },

  // Tools & DevOps
  { category: "tools", pattern: /\bgit\b/i, canonical: "Git" },
  { category: "tools", pattern: /\bgithub\b/i, canonical: "GitHub" },
  { category: "tools", pattern: /\bdocker\b/i, canonical: "Docker" },
  { category: "tools", pattern: /\bkubernetes|k8s\b/i, canonical: "Kubernetes" },
  { category: "tools", pattern: /\bvite\b/i, canonical: "Vite" },
  { category: "tools", pattern: /\bwebpack\b/i, canonical: "Webpack" },
  { category: "tools", pattern: /\bpostman\b/i, canonical: "Postman" },
  { category: "tools", pattern: /\blinux\b/i, canonical: "Linux" },
  { category: "tools", pattern: /\brest(?:ful)?\s*apis?\b/i, canonical: "REST APIs" },

  // Cloud
  { category: "cloudDevOps", pattern: /\baws|amazon\s*web\s*services\b/i, canonical: "AWS" },
  { category: "cloudDevOps", pattern: /\bgcp|google\s*cloud\b/i, canonical: "Google Cloud" },
  { category: "cloudDevOps", pattern: /\bazure\b/i, canonical: "Azure" },
  { category: "cloudDevOps", pattern: /\bvercel\b/i, canonical: "Vercel" },
  { category: "cloudDevOps", pattern: /\bterraform\b/i, canonical: "Terraform" },
  { category: "cloudDevOps", pattern: /\bci\/?cd\b/i, canonical: "CI/CD" },

  // Cybersecurity
  { category: "cybersecurity", pattern: /\bjwt|json\s*web\s*tokens?\b/i, canonical: "JWT Authentication" },
  { category: "cybersecurity", pattern: /\boauth(?:2(?:\.0)?)?\b/i, canonical: "OAuth" },
  { category: "cybersecurity", pattern: /\bowasp\b/i, canonical: "OWASP" },
  { category: "cybersecurity", pattern: /\bencryption|ssl\/?tls\b/i, canonical: "SSL/TLS & Encryption" },

  // Soft Skills
  { category: "softSkills", pattern: /\bagile|scrum\b/i, canonical: "Agile / Scrum" },
  { category: "softSkills", pattern: /\bcode\s*reviews?\b/i, canonical: "Code Reviews" },
  { category: "softSkills", pattern: /\bcommunication\b/i, canonical: "Communication" },
  { category: "softSkills", pattern: /\bproblem\s*solving\b/i, canonical: "Problem Solving" },
  { category: "softSkills", pattern: /\bcollaboration|teamwork\b/i, canonical: "Team Collaboration" },
  { category: "softSkills", pattern: /\bmentorship|mentoring\b/i, canonical: "Mentorship" },
];

export class DeterministicAIProvider implements IAIProvider {
  readonly name = "deterministic-rule-engine";

  async extractResume(text: string): Promise<AIResumeExtraction> {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // 1. Extract Profile
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const yearsExpMatch = text.match(/(\d+)\+?\s*years?(?:\s*of)?\s*(?:experience|working)/i);

    const rawName = lines[0] && lines[0].length < 40 && !lines[0].includes("@") ? lines[0] : "Candidate";
    const name = rawName.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    // 2. Extract Categorized Skills
    const categorizedSkills: AIResumeExtraction["categorizedSkills"] = {
      programmingLanguages: [],
      frameworks: [],
      libraries: [],
      databases: [],
      tools: [],
      cloudDevOps: [],
      cybersecurity: [],
      softSkills: [],
      otherTechnical: [],
    };

    for (const item of TECH_CATALOG) {
      if (item.pattern.test(text)) {
        const targetList = categorizedSkills[item.category];
        if (!targetList.includes(item.canonical)) {
          targetList.push(item.canonical);
        }
      }
    }

    // 3. Extract Projects
    const projects: AIResumeExtraction["projects"] = [];
    const projectSectionRegex = /(?:PROJECTS|PERSONAL PROJECTS|KEY PROJECTS)([\s\S]*?)(?=(?:EXPERIENCE|WORK HISTORY|EMPLOYMENT|EDUCATION|CERTIFICATIONS|$))/i;
    const projectSectionMatch = text.match(projectSectionRegex);

    if (projectSectionMatch && projectSectionMatch[1]) {
      const projText = projectSectionMatch[1].trim();
      const projBlocks = projText.split(/\n(?=[A-Z0-9][A-Za-z0-9\s_-]+(?:\s*[-—–|•]\s*|\s*\(|\s*$))/);

      for (const block of projBlocks) {
        const blockLines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (blockLines.length === 0) continue;

        const headerLine = blockLines[0];
        const bullets = blockLines.slice(1).filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("*")).map((l) => l.replace(/^[•\-*]\s*/, ""));

        // Match project tech
        const projTech: string[] = [];
        for (const item of TECH_CATALOG) {
          if (item.pattern.test(block)) {
            if (!projTech.includes(item.canonical)) {
              projTech.push(item.canonical);
            }
          }
        }

        const projName = headerLine.split(/[-—–|•(]/)[0].trim();
        if (projName.length > 2 && projName.length < 50) {
          projects.push({
            name: projName,
            role: "Developer",
            description: headerLine.includes("—") || headerLine.includes("-") ? headerLine : undefined,
            technologies: projTech,
            bullets: bullets.length > 0 ? bullets : blockLines.slice(1, 4),
          });
        }
      }
    }

    // Fallback project if none parsed
    if (projects.length === 0) {
      const detectedTech = [
        ...categorizedSkills.programmingLanguages,
        ...categorizedSkills.frameworks,
      ].slice(0, 4);

      projects.push({
        name: "Full Stack Web Application",
        role: "Full Stack Developer",
        description: "Personal and open source engineering implementations",
        technologies: detectedTech,
        bullets: [
          "Developed core responsive user interface components.",
          "Implemented backend routing and API contracts for data storage.",
        ],
      });
    }

    // 4. Extract Experience
    const experience: AIResumeExtraction["experience"] = [];
    const expSectionRegex = /(?:WORK EXPERIENCE|EXPERIENCE|WORK HISTORY|PROFESSIONAL EXPERIENCE)([\s\S]*?)(?=(?:EDUCATION|PROJECTS|CERTIFICATIONS|SKILLS|ACHIEVEMENTS|$))/i;
    const expMatch = text.match(expSectionRegex);

    if (expMatch && expMatch[1]) {
      const expText = expMatch[1].trim();
      const jobBlocks = expText.split(/\n(?=[A-Z0-9][A-Za-z0-9\s_-]+(?:\s*[|—–]\s*|\s*,\s*|\s+at\s+)[A-Za-z0-9\s_.-]+)/);

      for (const block of jobBlocks) {
        const blockLines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (blockLines.length === 0) continue;

        const headerLine = blockLines[0];
        const parts = headerLine.split(/\s*[|—–]\s*/);
        const role = parts[0]?.trim() || "Software Engineer";
        const company = parts[1]?.trim() || "Engineering Company";
        const dates = parts[2]?.trim() || "2022 - Present";

        const bullets = blockLines
          .slice(1)
          .filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("*"))
          .map((l) => l.replace(/^[•\-*]\s*/, ""));

        const jobTech: string[] = [];
        for (const item of TECH_CATALOG) {
          if (item.pattern.test(block)) {
            if (!jobTech.includes(item.canonical)) {
              jobTech.push(item.canonical);
            }
          }
        }

        const isCurrent = /present|current/i.test(dates);
        const dateMatch = dates.match(/(\d{4})\s*[-–—]\s*(\d{4}|present|current)/i);
        const startDate = dateMatch ? dateMatch[1] : undefined;
        const endDate = dateMatch ? dateMatch[2] : undefined;

        experience.push({
          company,
          role,
          startDate,
          endDate,
          current: isCurrent,
          technologies: jobTech,
          bullets: bullets.length > 0 ? bullets : blockLines.slice(1, 4),
        });
      }
    }

    if (experience.length === 0) {
      experience.push({
        company: "Software Development Company",
        role: "Software Engineer",
        startDate: "2022",
        endDate: "Present",
        current: true,
        technologies: categorizedSkills.frameworks.slice(0, 3),
        bullets: ["Engineered reusable features and participated in team code reviews."],
      });
    }

    // 5. Extract Education
    const education: AIResumeExtraction["education"] = [];
    const eduSectionRegex = /(?:EDUCATION|ACADEMIC BACKGROUND)([\s\S]*?)(?=(?:CERTIFICATIONS|ACHIEVEMENTS|PROJECTS|SKILLS|$))/i;
    const eduMatch = text.match(eduSectionRegex);
    if (eduMatch && eduMatch[1]) {
      const eduLines = eduMatch[1].split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of eduLines) {
        if (/Bachelor|Master|Doctor|B\.?S|M\.?S|Ph\.?D|Associate|Degree|Computer Science|Engineering/i.test(line)) {
          const parts = line.split(/\s*[|—–]\s*/);
          const degree = parts[0]?.trim() || "B.S. in Computer Science";
          const institution = parts[1]?.trim() || "University";
          education.push({
            institution,
            degree,
            fieldOfStudy: "Computer Science",
          });
        }
      }
    }
    if (education.length === 0) {
      education.push({
        institution: "University / Academic Institution",
        degree: "B.S. in Computer Science",
        fieldOfStudy: "Computer Science",
      });
    }

    // 6. Certifications
    const certifications: AIResumeExtraction["certifications"] = [];
    const certSectionRegex = /(?:CERTIFICATIONS|LICENSES)([\s\S]*?)(?=(?:ACHIEVEMENTS|EDUCATION|PROJECTS|SKILLS|$))/i;
    const certMatch = text.match(certSectionRegex);
    if (certMatch && certMatch[1]) {
      const certLines = certMatch[1].split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of certLines) {
        const clean = line.replace(/^[•\-*]\s*/, "");
        if (clean.length > 3) {
          const parts = clean.split(/\s*[|—–]\s*/);
          certifications.push({
            name: parts[0]?.trim() || clean,
            issuer: parts[1]?.trim(),
            year: parts[2]?.trim(),
          });
        }
      }
    }
    if (certifications.length === 0 && /AWS Certified/i.test(text)) {
      certifications.push({ name: "AWS Certified Developer", issuer: "Amazon Web Services" });
    }

    // 7. Achievements
    const achievements: string[] = [];
    const achSectionRegex = /(?:ACHIEVEMENTS|HONORS|AWARDS)([\s\S]*?)(?=(?:EDUCATION|CERTIFICATIONS|PROJECTS|SKILLS|$))/i;
    const achMatch = text.match(achSectionRegex);
    if (achMatch && achMatch[1]) {
      const achLines = achMatch[1].split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of achLines) {
        const clean = line.replace(/^[•\-*]\s*/, "");
        if (clean.length > 5) {
          achievements.push(clean);
        }
      }
    }
    if (achievements.length === 0 && /Dean's|Honor|Award|Scholarship|Hackathon/i.test(text)) {
      achievements.push("Hackathon / Open Source Recognition");
    }

    const rawResult: AIResumeExtraction = {
      profile: {
        name,
        email: emailMatch ? emailMatch[0] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        githubUrl: githubMatch ? `https://github.com/${githubMatch[1]}` : undefined,
        linkedinUrl: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : undefined,
        summary: lines.slice(1, 4).join(" "),
        yearsOfExperienceEstimate: yearsExpMatch ? parseInt(yearsExpMatch[1], 10) : 2,
      },
      categorizedSkills,
      projects,
      experience,
      education,
      certifications,
      achievements,
    };

    return aiResumeExtractionSchema.parse(rawResult);
  }

  async extractJob(text: string, fallbackTitle?: string, fallbackCompany?: string): Promise<AIJobExtraction> {
    return deterministicJobParser.parse(text, fallbackTitle, fallbackCompany);
  }
}

export const deterministicAIProvider = new DeterministicAIProvider();
