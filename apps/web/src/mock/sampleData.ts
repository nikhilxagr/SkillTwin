import {
  computeCareerReadiness,
  generateInterviewQuestions,
  generateProjectRecommendations,
  generateProjectBlueprint,
  type ResumeExtraction,
  type SkillMatrix,
  type JobExtraction,
  type JobAnalysis,
  type GapAnalysisReport,
  type ResumeOptimizationReport,
  type JobSpecificTailoredResume,
  type CareerReadinessReport,
  type InterviewSessionState,
  type InterviewHistoryItem,
  type ProjectRecommendationReport,
  type ProjectBlueprint,
} from "@skilltwin/contracts";

export const sampleResume: ResumeExtraction = {
  id: "resume_sample_01",
  fileName: "Alex_Rivera_FullStack_Resume.pdf",
  fileType: "pdf",
  fileSizeBytes: 142800,
  rawText: `Alex Rivera
San Francisco, CA | alex.rivera@devmail.com | github.com/alexrivera-dev | linkedin.com/in/alexrivera-dev

PROFESSIONAL SUMMARY
Full Stack Software Engineer with 3+ years of experience building performant web applications using JavaScript, React, and Node.js. Passionate about developer tooling, API design, and clean component architectures.

TECHNICAL SKILLS
Languages: JavaScript (ES6+), TypeScript, Python, HTML5, CSS3/Sass
Frontend: React.js, React Hooks, Redux Toolkit, Tailwind CSS, Next.js (Basic)
Backend: Node.js, Express.js, RESTful APIs, JWT Authentication
Databases: MongoDB, Mongoose, PostgreSQL (Basic)
Tools & DevOps: Git, GitHub, Docker (Basic), Vite, Postman, Linux

PROJECTS
DevPulse — Developer Analytics & Sprint Dashboard (github.com/alexrivera-dev/devpulse)
• Architected a responsive dashboard with React 18, React Router, and Tailwind CSS.
• Built Express.js backend services handling user authentication and RESTful API endpoints for metrics retrieval.
• Integrated MongoDB with Mongoose schemas for sprint metrics and developer activity aggregation.
• Implemented client-side state management using Redux Toolkit to sync real-time status updates.

CloudCart — Headless E-Commerce Platform (github.com/alexrivera-dev/cloudcart)
• Developed product catalog and cart checkout workflow using React and Context API.
• Designed Node.js microservices with JWT-based session security and role-based access control.
• Created database indexes on MongoDB product collections, improving query response consistency.

EXPERIENCE
Software Engineer | CodeCraft Solutions (2022 – Present)
• Built reusable React components used across 4 internal web applications.
• Collaborated with backend teams to migrate legacy endpoints to standard REST APIs.
• Participated in bi-weekly code reviews and agile sprint planning sessions.

Junior Web Developer | PixelStudio Labs (2021 – 2022)
• Maintained client websites using JavaScript, HTML5, and CSS3.
• Optimized front-end asset loading, improving Lighthouse performance scores.

EDUCATION
Bachelor of Science in Computer Science | University of California, Davis (2017 – 2021)`,
  profile: {
    name: "Alex Rivera",
    email: "alex.rivera@devmail.com",
    location: "San Francisco, CA",
    githubUrl: "https://github.com/alexrivera-dev",
    linkedinUrl: "https://linkedin.com/in/alexrivera-dev",
    summary:
      "Full Stack Software Engineer with 3+ years of experience building performant web applications using JavaScript, React, and Node.js. Passionate about developer tooling, API design, and clean component architectures.",
    yearsOfExperienceEstimate: 3,
  },
  skillsClaimed: [
    "JavaScript",
    "TypeScript",
    "Python",
    "React.js",
    "React Hooks",
    "Redux Toolkit",
    "Tailwind CSS",
    "Next.js",
    "Node.js",
    "Express.js",
    "RESTful APIs",
    "JWT Authentication",
    "MongoDB",
    "PostgreSQL",
    "Git",
    "Docker",
    "Linux",
  ],
  projects: [
    {
      name: "DevPulse",
      role: "Lead Developer",
      description: "Developer Analytics & Sprint Dashboard",
      technologies: ["React", "Express.js", "Node.js", "MongoDB", "Redux Toolkit", "Tailwind CSS"],
      bullets: [
        "Architected a responsive dashboard with React 18, React Router, and Tailwind CSS.",
        "Built Express.js backend services handling user authentication and RESTful API endpoints for metrics retrieval.",
        "Integrated MongoDB with Mongoose schemas for sprint metrics and developer activity aggregation.",
        "Implemented client-side state management using Redux Toolkit to sync real-time status updates.",
      ],
      githubUrl: "https://github.com/alexrivera-dev/devpulse",
    },
    {
      name: "CloudCart",
      role: "Full Stack Engineer",
      description: "Headless E-Commerce Platform",
      technologies: ["React", "Node.js", "MongoDB", "JWT", "Context API"],
      bullets: [
        "Developed product catalog and cart checkout workflow using React and Context API.",
        "Designed Node.js microservices with JWT-based session security and role-based access control.",
        "Created database indexes on MongoDB product collections, improving query response consistency.",
      ],
      githubUrl: "https://github.com/alexrivera-dev/cloudcart",
    },
  ],
  experience: [
    {
      company: "CodeCraft Solutions",
      role: "Software Engineer",
      location: "San Francisco, CA",
      startDate: "2022-03",
      endDate: "Present",
      current: true,
      technologies: ["React", "JavaScript", "REST APIs"],
      bullets: [
        "Built reusable React components used across 4 internal web applications.",
        "Collaborated with backend teams to migrate legacy endpoints to standard REST APIs.",
        "Participated in bi-weekly code reviews and agile sprint planning sessions.",
      ],
    },
    {
      company: "PixelStudio Labs",
      role: "Junior Web Developer",
      location: "Remote",
      startDate: "2021-06",
      endDate: "2022-02",
      current: false,
      technologies: ["JavaScript", "HTML5", "CSS3"],
      bullets: [
        "Maintained client websites using JavaScript, HTML5, and CSS3.",
        "Optimized front-end asset loading, improving Lighthouse performance scores.",
      ],
    },
  ],
  education: [
    {
      institution: "University of California, Davis",
      degree: "Bachelor of Science in Computer Science",
      fieldOfStudy: "Computer Science",
      startDate: "2017",
      endDate: "2021",
    },
  ],
  certifications: [],
  achievements: ["Dean's Honor List (2020)"],
  parsedAt: "2026-10-02T10:00:00.000Z",
};

export const sampleSkillMatrix: SkillMatrix = {
  resumeId: "resume_sample_01",
  items: [
    {
      canonicalName: "JavaScript",
      category: "Languages",
      aliases: ["JS", "ECMAScript", "ES6+"],
      proficiency: "Strong",
      confidence: 90,
      evidenceLevel: "Demonstrated",
      evidence: [
        {
          id: "ev-js-1",
          sourceType: "skills_section",
          context: "Directly listed in technical skills section",
          weight: 20,
          verified: true,
        },
        {
          id: "ev-js-2",
          sourceType: "work_experience",
          context: "2+ years commercial experience at CodeCraft Solutions & PixelStudio Labs",
          sourceTitle: "CodeCraft Solutions",
          weight: 40,
          verified: true,
        },
        {
          id: "ev-js-3",
          sourceType: "project",
          context: "Underlying language for DevPulse and CloudCart applications",
          sourceTitle: "DevPulse",
          weight: 30,
          verified: true,
        },
      ],
      explanation: "Consistently used across work experience, open source repositories, and multi-tier projects.",
      missingEvidence: ["Static code analysis verification", "AST / compiler tooling"],
      relatedSkills: ["TypeScript", "Node.js", "React"],
      claimed: true,
      demonstrated: true,
    },
    {
      canonicalName: "React",
      category: "Frontend",
      aliases: ["React.js", "ReactJS"],
      proficiency: "Strong",
      confidence: 86,
      evidenceLevel: "Demonstrated",
      evidence: [
        {
          id: "ev-react-1",
          sourceType: "skills_section",
          context: "Listed in technical skills under Frontend",
          weight: 15,
          verified: true,
        },
        {
          id: "ev-react-2",
          sourceType: "project",
          context: "Architected DevPulse dashboard with React 18, React Router, Redux Toolkit",
          sourceTitle: "DevPulse",
          weight: 35,
          verified: true,
        },
        {
          id: "ev-react-3",
          sourceType: "project",
          context: "Built catalog & checkout workflow with React & Context API",
          sourceTitle: "CloudCart",
          weight: 25,
          verified: true,
        },
        {
          id: "ev-react-4",
          sourceType: "work_experience",
          context: "Built reusable React component library across 4 internal apps",
          sourceTitle: "CodeCraft Solutions",
          weight: 15,
          verified: true,
        },
      ],
      explanation: "Multiple production-style projects showing hooks, state management, and reusable component libraries.",
      missingEvidence: ["Automated unit/integration tests with Vitest or React Testing Library"],
      relatedSkills: ["Redux", "React Router", "Next.js", "HTML5", "CSS3"],
      claimed: true,
      demonstrated: true,
    },
    {
      canonicalName: "Node.js",
      category: "Backend",
      aliases: ["NodeJS", "Node"],
      proficiency: "Intermediate",
      confidence: 72,
      evidenceLevel: "Demonstrated",
      evidence: [
        {
          id: "ev-node-1",
          sourceType: "skills_section",
          context: "Listed in Backend skills",
          weight: 15,
          verified: true,
        },
        {
          id: "ev-node-2",
          sourceType: "project",
          context: "Engineered Express.js REST API with JWT auth and metrics endpoints",
          sourceTitle: "DevPulse",
          weight: 30,
          verified: true,
        },
        {
          id: "ev-node-3",
          sourceType: "project",
          context: "Implemented backend microservices with role-based auth in CloudCart",
          sourceTitle: "CloudCart",
          weight: 27,
          verified: true,
        },
      ],
      explanation: "Demonstrated backend routing, REST API controllers, and JWT token authorization in personal projects.",
      missingEvidence: ["High-concurrency benchmark evidence", "Production cluster/worker thread configuration", "Queue/worker systems like BullMQ/Redis"],
      relatedSkills: ["Express.js", "REST APIs", "MongoDB"],
      claimed: true,
      demonstrated: true,
    },
    {
      canonicalName: "Express.js",
      category: "Backend",
      aliases: ["Express", "ExpressJS"],
      proficiency: "Intermediate",
      confidence: 70,
      evidenceLevel: "Demonstrated",
      evidence: [
        {
          id: "ev-exp-1",
          sourceType: "skills_section",
          context: "Listed in technical skills",
          weight: 20,
          verified: true,
        },
        {
          id: "ev-exp-2",
          sourceType: "project",
          context: "Built routing and middleware authentication controllers",
          sourceTitle: "DevPulse",
          weight: 50,
          verified: true,
        },
      ],
      explanation: "Used as core web framework for 2 full-stack projects.",
      missingEvidence: ["Custom middleware for rate-limiting, error boundaries, or structured logging"],
      relatedSkills: ["Node.js", "REST APIs"],
      claimed: true,
      demonstrated: true,
    },
    {
      canonicalName: "MongoDB",
      category: "Databases",
      aliases: ["Mongo", "Mongoose"],
      proficiency: "Intermediate",
      confidence: 68,
      evidenceLevel: "Demonstrated",
      evidence: [
        {
          id: "ev-mongo-1",
          sourceType: "skills_section",
          context: "Listed in technical skills under Databases",
          weight: 20,
          verified: true,
        },
        {
          id: "ev-mongo-2",
          sourceType: "project",
          context: "Designed schema models and created indexes for fast catalog lookups",
          sourceTitle: "CloudCart",
          weight: 48,
          verified: true,
        },
      ],
      explanation: "Demonstrated schema modeling and indexing in project repositories.",
      missingEvidence: ["Replica set configuration", "Aggregation pipeline pipelines ($lookup, $facet)", "Sharding"],
      relatedSkills: ["PostgreSQL", "Mongoose"],
      claimed: true,
      demonstrated: true,
    },
    {
      canonicalName: "TypeScript",
      category: "Languages",
      aliases: ["TS"],
      proficiency: "Beginner",
      confidence: 45,
      evidenceLevel: "WeakEvidence",
      evidence: [
        {
          id: "ev-ts-1",
          sourceType: "skills_section",
          context: "Listed in technical skills section",
          weight: 25,
          verified: true,
        },
      ],
      explanation: "Claimed in skills section, but project bullets lack specific mentions of advanced generic types or strict typing workflows.",
      missingEvidence: ["Typescript configuration (tsconfig.json)", "Generics / utility types in project code", "End-to-end typed API contracts"],
      relatedSkills: ["JavaScript"],
      claimed: true,
      demonstrated: false,
    },
    {
      canonicalName: "Python",
      category: "Languages",
      aliases: ["Py"],
      proficiency: "Beginner",
      confidence: 30,
      evidenceLevel: "ClaimedOnly",
      evidence: [
        {
          id: "ev-py-1",
          sourceType: "skills_section",
          context: "Listed in technical skills section",
          weight: 30,
          verified: true,
        },
      ],
      explanation: "Listed under languages, but no project bullets, libraries (Django, FastAPI, Flask), or scripts were documented.",
      missingEvidence: ["Python project or repository evidence", "Framework usage (FastAPI / Django)", "Data science / automation scripts"],
      relatedSkills: [],
      claimed: true,
      demonstrated: false,
    },
    {
      canonicalName: "Docker",
      category: "Cloud/DevOps",
      aliases: ["Containerization"],
      proficiency: "Beginner",
      confidence: 32,
      evidenceLevel: "WeakEvidence",
      evidence: [
        {
          id: "ev-doc-1",
          sourceType: "skills_section",
          context: "Listed as 'Docker (Basic)' in Tools & DevOps",
          weight: 32,
          verified: true,
        },
      ],
      explanation: "Claimed as basic in skills list; no container configuration, multi-stage builds, or docker-compose files detailed.",
      missingEvidence: ["Dockerfile in projects", "Multi-container compose setup", "CI/CD container deployment"],
      relatedSkills: ["Linux", "Git"],
      claimed: true,
      demonstrated: false,
    },
    {
      canonicalName: "Automated Testing",
      category: "Testing",
      aliases: ["Unit Testing", "Jest", "Vitest", "Cypress", "Testing"],
      proficiency: "Weak",
      confidence: 15,
      evidenceLevel: "WeakEvidence",
      evidence: [],
      explanation: "No testing libraries (Jest, Vitest, Cypress, Playwright) or test coverage statements were found in resume projects.",
      missingEvidence: ["Unit tests for backend endpoints", "Component test suites", "Integration / E2E testing pipeline"],
      relatedSkills: [],
      claimed: false,
      demonstrated: false,
    },
    {
      canonicalName: "System Design",
      category: "System Design",
      aliases: ["Distributed Systems", "Software Architecture"],
      proficiency: "Weak",
      confidence: 20,
      evidenceLevel: "WeakEvidence",
      evidence: [
        {
          id: "ev-sys-1",
          sourceType: "project",
          context: "Designed microservices and schema indexes in CloudCart",
          sourceTitle: "CloudCart",
          weight: 20,
          verified: true,
        },
      ],
      explanation: "Basic service separation and indexes shown, but caching, rate-limiting, load balancing, or message queues not demonstrated.",
      missingEvidence: ["Caching tier (Redis/Memcached)", "Message broker (Kafka/RabbitMQ)", "Load balancing & horizontal scaling docs"],
      relatedSkills: [],
      claimed: false,
      demonstrated: false,
    },
  ],
  summary: {
    totalSkills: 10,
    demonstratedCount: 5,
    claimedOnlyCount: 1,
    weakEvidenceCount: 4,
    averageConfidence: 53,
    topSkills: ["JavaScript", "React", "Node.js", "Express.js", "MongoDB"],
  },
  generatedAt: "2026-10-02T10:05:00.000Z",
};

export const sampleJobDescription: JobExtraction = {
  id: "jd_sample_01",
  title: "Senior Full Stack Engineer",
  company: "Linear Systems Inc.",
  location: "San Francisco, CA / Remote",
  rawText: `Senior Full Stack Engineer — Developer Tools Team
Location: San Francisco, CA or Remote (US/Canada)

About the Role:
We are looking for a Senior Full Stack Engineer to join our Developer Tools team. You will lead the development of high-performance frontend interfaces and scalable backend API services used by thousands of engineering teams daily.

Requirements (Must Haves):
• 3+ years of professional full-stack software development experience.
• Strong proficiency in modern JavaScript and TypeScript.
• Deep experience building scalable client applications using React.js and modern state management.
• Solid background developing backend services and REST APIs with Node.js and Express.
• Practical experience with automated testing (Jest, Vitest, Cypress, or similar) across frontend and backend.
• Hands-on familiarity with Docker and containerized development workflows.
• Solid understanding of system design, database indexing, and API security.

Preferred Qualifications (Nice to Haves):
• Experience with cloud deployments on AWS (ECS, S3, Lambda).
• Experience with GraphQL or gRPC in production.
• Familiarity with PostgreSQL and relational database design.
• Passion for developer productivity and open-source tooling.

Responsibilities:
• Architect, build, and maintain frontend user experiences with sub-second response times.
• Design robust RESTful endpoints with comprehensive automated test coverage.
• Collaborate with product and design to iterate quickly on new features.
• Champion engineering best practices, code reviews, and containerized deployment standards.`,
  experience: {
    minYears: 3,
    maxYears: 6,
    level: "Senior",
    description: "3+ years of professional full-stack software development experience.",
  },
  education: "Bachelor's degree in Computer Science or equivalent practical experience",
  requiredSkills: [
    {
      canonicalName: "JavaScript",
      category: "Languages",
      importance: "Required",
      minimumProficiency: "Strong",
      contextSentence: "Strong proficiency in modern JavaScript and TypeScript.",
    },
    {
      canonicalName: "TypeScript",
      category: "Languages",
      importance: "Required",
      minimumProficiency: "Strong",
      contextSentence: "Strong proficiency in modern JavaScript and TypeScript.",
    },
    {
      canonicalName: "React",
      category: "Frontend",
      importance: "Required",
      minimumProficiency: "Strong",
      contextSentence: "Deep experience building scalable client applications using React.js.",
    },
    {
      canonicalName: "Node.js",
      category: "Backend",
      importance: "Required",
      minimumProficiency: "Strong",
      contextSentence: "Solid background developing backend services and REST APIs with Node.js.",
    },
    {
      canonicalName: "Automated Testing",
      category: "Testing",
      importance: "Required",
      minimumProficiency: "Intermediate",
      contextSentence: "Practical experience with automated testing (Jest, Vitest, Cypress, or similar).",
    },
    {
      canonicalName: "Docker",
      category: "Cloud/DevOps",
      importance: "Required",
      minimumProficiency: "Intermediate",
      contextSentence: "Hands-on familiarity with Docker and containerized development workflows.",
    },
    {
      canonicalName: "System Design",
      category: "System Design",
      importance: "Required",
      minimumProficiency: "Intermediate",
      contextSentence: "Solid understanding of system design, database indexing, and API security.",
    },
  ],
  preferredSkills: [
    {
      canonicalName: "AWS",
      category: "Cloud/DevOps",
      importance: "Preferred",
      minimumProficiency: "Intermediate",
      contextSentence: "Experience with cloud deployments on AWS (ECS, S3, Lambda).",
    },
    {
      canonicalName: "GraphQL",
      category: "Backend",
      importance: "Preferred",
      minimumProficiency: "Intermediate",
      contextSentence: "Experience with GraphQL or gRPC in production.",
    },
    {
      canonicalName: "PostgreSQL",
      category: "Databases",
      importance: "Preferred",
      minimumProficiency: "Intermediate",
      contextSentence: "Familiarity with PostgreSQL and relational database design.",
    },
  ],
  responsibilities: [
    "Architect, build, and maintain frontend user experiences with sub-second response times.",
    "Design robust RESTful endpoints with comprehensive automated test coverage.",
    "Collaborate with product and design to iterate quickly on new features.",
    "Champion engineering best practices, code reviews, and containerized deployment standards.",
  ],
  qualifications: [
    "3+ years building production web applications.",
    "B.S. in Computer Science or equivalent practical experience.",
    "Track record of writing maintainable, clean code.",
  ],
  keywords: {
    programmingLanguages: ["JavaScript", "TypeScript"],
    frameworks: ["React", "Express.js", "Redux"],
    libraries: ["GraphQL", "Mongoose"],
    databases: ["PostgreSQL", "MongoDB"],
    tools: ["Docker", "Git", "Jest", "Vitest", "Cypress"],
    cloudDevOps: ["AWS", "ECS", "Lambda", "S3"],
    cybersecurity: [],
    softSkills: ["Collaboration", "Code Reviews", "Product Mindset"],
    generalKeywords: ["System Design", "REST APIs"],
    technicalSkills: ["JavaScript", "TypeScript", "REST APIs", "System Design"],
    cloud: ["AWS", "ECS", "Lambda", "S3"],
  },
  parsedAt: "2026-10-02T10:15:00.000Z",
};

export const sampleJobAnalysis: JobAnalysis = {
  id: "analysis_sample_01",
  job: sampleJobDescription,
  summary: {
    roleTitle: "Senior Full Stack Engineer",
    company: "Linear Systems Inc.",
    totalRequiredSkills: 7,
    totalPreferredSkills: 3,
    experienceLevel: "Senior",
    minYearsExperience: 3,
    topCategories: ["Languages", "Frontend", "Backend", "Databases", "Cloud/DevOps"],
  },
  analyzedAt: "2026-10-02T10:15:00.000Z",
};

export const sampleGapAnalysis: GapAnalysisReport = {
  id: "gap_sample_01",
  resumeId: "resume_sample_01",
  jobId: "jd_sample_01",
  targetRole: "Senior Full Stack Engineer",
  company: "Linear Systems Inc.",
  summary: {
    totalRequired: 7,
    totalPreferred: 3,
    matchCount: 2,
    partialCount: 2,
    criticalGapCount: 3,
    weakEvidenceCount: 1,
    optionalGapCount: 2,
    alignmentRating: "Moderate",
    alignmentScore: 58,
    alignmentExplanation:
      "Strong alignment on Core Frontend (React, JavaScript) and solid foundations in Node.js. However, 3 required engineering standards (Docker, Automated Testing, and System Design depth) represent critical gaps against this Senior role.",
    scoringModel: {
      modelName: "SkillTwin Deterministic 4-Factor Priority Model",
      formula:
        "Priority Score = Requirement Urgency (40%) + Proficiency Deficit (30%) + Evidence Deficit (15%) + Ecosystem Synergy (15%)",
      factors: [
        {
          factor: "Requirement Urgency",
          weight: "40 pts max",
          description: "Required role qualifications receive 40 pts; preferred/nice-to-have qualifications receive 15 pts.",
        },
        {
          factor: "Proficiency Deficit",
          weight: "30 pts max",
          description: "Delta between role target proficiency and candidate verified proficiency.",
        },
        {
          factor: "Evidence Deficit",
          weight: "15 pts max",
          description: "Penalty for zero sources or uncorroborated single keyword mentions.",
        },
        {
          factor: "Ecosystem Synergy",
          weight: "15 pts max",
          description: "Synergy bonus awarded when candidate demonstrates adjacent foundation technologies.",
        },
      ],
      priorityThresholds: {
        critical: "Priority Score >= 80 (Immediate hiring blocker)",
        high: "Priority Score 60 - 79 (Substantial gap with strong learning synergy)",
        medium: "Priority Score 40 - 59 (Moderate gap or preferred qualification)",
        low: "Priority Score < 40 (Secondary optional item or fully matched)",
      },
    },
  },
  criticalGaps: [
    {
      canonicalName: "Docker",
      category: "Cloud/DevOps",
      status: "GAP",
      importance: "Required",
      candidateProficiency: "Beginner",
      requiredProficiency: "Intermediate",
      candidateConfidence: 32,
      evidenceCount: 1,
      evidenceSummary: "Listed as basic in skills list; no container configuration or deployment bullets exist.",
      gapRationale: "Role requires containerized workflows; your resume lacks practical container proof.",
      suggestedAction:
        "Add a Dockerfile and docker-compose.yml to DevPulse. Verify multi-stage builds and container networking before claiming intermediate Docker proficiency.",
      priority: "Critical",
      priorityScore: 85,
      priorityRationale:
        "[Score: 85/100 • Critical Priority] Mandatory role requirement (+40 pts), Moderate proficiency gap (+15 pts), Single weak keyword mention (+10 pts). High ecosystem synergy with candidate backend skills in Node.js and Linux (+20 pts).",
      priorityFactors: {
        requirementWeight: 40,
        proficiencyDeficit: 15,
        evidenceDeficit: 10,
        ecosystemSynergy: 15,
        totalScore: 85,
        explanation: "High-priority infrastructure requirement with direct backend applicability.",
      },
      relatedCandidateSkills: ["Node.js", "Linux"],
    },
    {
      canonicalName: "Automated Testing",
      category: "Testing",
      status: "GAP",
      importance: "Required",
      candidateProficiency: "Weak",
      requiredProficiency: "Intermediate",
      candidateConfidence: 15,
      evidenceCount: 0,
      evidenceSummary: "No unit or integration testing frameworks detected in resume text.",
      gapRationale: "Senior roles mandate automated test coverage for reliability and team quality standards.",
      suggestedAction:
        "Introduce Vitest or Jest test suites into CloudCart or DevPulse. Document coverage for core authentication and API endpoints.",
      priority: "Critical",
      priorityScore: 85,
      priorityRationale:
        "[Score: 85/100 • Critical Priority] Mandatory role requirement (+40 pts), Major proficiency gap (+25 pts), Zero verifiable project deliverables (+15 pts). High ecosystem synergy with React and Node.js (+10 pts).",
      priorityFactors: {
        requirementWeight: 40,
        proficiencyDeficit: 25,
        evidenceDeficit: 15,
        ecosystemSynergy: 10,
        totalScore: 85,
        explanation: "Critical quality engineering gap.",
      },
      relatedCandidateSkills: ["React", "Node.js"],
    },
    {
      canonicalName: "System Design",
      category: "System Design",
      status: "GAP",
      importance: "Required",
      candidateProficiency: "Weak",
      requiredProficiency: "Intermediate",
      candidateConfidence: 20,
      evidenceCount: 1,
      evidenceSummary: "Basic microservices and database indexing mentioned; lacking caching, queues, or distributed concepts.",
      gapRationale: "The JD explicitly targets candidates who design scalable systems and handle edge cases.",
      suggestedAction:
        "Demonstrate caching (Redis) or async processing (BullMQ) in a personal project before updating resume architecture bullets.",
      priority: "Critical",
      priorityScore: 80,
      priorityRationale:
        "[Score: 80/100 • Critical Priority] Mandatory role requirement (+40 pts), Major proficiency gap (+25 pts), Single weak evidence mention (+10 pts). Synergy with Node.js and MongoDB (+5 pts).",
      priorityFactors: {
        requirementWeight: 40,
        proficiencyDeficit: 25,
        evidenceDeficit: 10,
        ecosystemSynergy: 5,
        totalScore: 80,
        explanation: "Architectural depth required for senior level.",
      },
      relatedCandidateSkills: ["Node.js", "MongoDB"],
    },
  ],
  partialGaps: [
    {
      canonicalName: "TypeScript",
      category: "Languages",
      status: "PARTIAL",
      importance: "Required",
      candidateProficiency: "Beginner",
      requiredProficiency: "Strong",
      candidateConfidence: 45,
      evidenceCount: 1,
      evidenceSummary: "Listed in skills section; not explicitly emphasized in project bullets.",
      gapRationale: "TypeScript is a non-negotiable primary language requirement for this team.",
      suggestedAction:
        "If DevPulse is typed, rewrite its bullet to explicitly state: 'Developed typed React components and Node.js REST contracts using TypeScript'. Only add if genuinely true.",
      priority: "High",
      priorityScore: 75,
      priorityRationale:
        "[Score: 75/100 • High Priority] Mandatory role requirement (+40 pts), Major proficiency gap (+25 pts), Single weak mention (+10 pts). Direct synergy with JavaScript and React (+15 pts).",
      priorityFactors: {
        requirementWeight: 40,
        proficiencyDeficit: 25,
        evidenceDeficit: 10,
        ecosystemSynergy: 15,
        totalScore: 75,
        explanation: "Highest leverage skill to upgrade given existing JavaScript strength.",
      },
      relatedCandidateSkills: ["JavaScript", "React"],
    },
    {
      canonicalName: "Node.js",
      category: "Backend",
      status: "PARTIAL",
      importance: "Required",
      candidateProficiency: "Intermediate",
      requiredProficiency: "Strong",
      candidateConfidence: 72,
      evidenceCount: 3,
      evidenceSummary: "Demonstrated Express.js API design, but lacking high-throughput or production scaling details.",
      gapRationale: "Candidate has solid project Node.js experience, but Senior role seeks deeper architecture.",
      suggestedAction:
        "Clarify performance considerations, connection pooling, or error handling mechanisms in existing backend bullets.",
      priority: "High",
      priorityScore: 65,
      priorityRationale:
        "[Score: 65/100 • High Priority] Mandatory role requirement (+40 pts), Moderate proficiency gap (+15 pts), Multiple verified sources (+0 pts). Direct synergy with Express.js (+10 pts).",
      priorityFactors: {
        requirementWeight: 40,
        proficiencyDeficit: 15,
        evidenceDeficit: 0,
        ecosystemSynergy: 10,
        totalScore: 65,
        explanation: "Solid candidate foundation needing senior scale substantiation.",
      },
      relatedCandidateSkills: ["Express.js", "JavaScript"],
    },
  ],
  weakEvidence: [
    {
      canonicalName: "Python",
      category: "Languages",
      status: "WEAK_EVIDENCE",
      importance: "Preferred",
      candidateProficiency: "Beginner",
      requiredProficiency: "Beginner",
      candidateConfidence: 30,
      evidenceCount: 1,
      evidenceSummary: "Present in skills list without supporting project bullets.",
      gapRationale: "Technical recruiters and ATS screeners discount claimed skills with zero project references.",
      suggestedAction:
        "If you have used Python for scripting or automation, add a brief bullet point. If not actively practiced, consider omitting it from your core resume.",
      priority: "Low",
      priorityScore: 35,
      priorityRationale:
        "[Score: 35/100 • Low Priority] Preferred qualification (+15 pts), slight deficit (+10 pts), single mention (+10 pts).",
      priorityFactors: {
        requirementWeight: 15,
        proficiencyDeficit: 10,
        evidenceDeficit: 10,
        ecosystemSynergy: 0,
        totalScore: 35,
        explanation: "Optional qualification with weak evidence.",
      },
      relatedCandidateSkills: [],
    },
  ],
  strongMatches: [
    {
      canonicalName: "React",
      category: "Frontend",
      status: "MATCH",
      importance: "Required",
      candidateProficiency: "Strong",
      requiredProficiency: "Strong",
      candidateConfidence: 86,
      evidenceCount: 4,
      evidenceSummary: "Substantiated across 2 major personal projects and 2 years of commercial employment.",
      gapRationale: "Candidate exceeds baseline expectations for frontend React development.",
      suggestedAction: "Maintain emphasis on modular component design, state architecture, and performance.",
      priority: "Low",
      priorityScore: 25,
      priorityRationale: "[Score: 25/100 • Low Priority] Core required competency fully verified.",
      priorityFactors: {
        requirementWeight: 25,
        proficiencyDeficit: 0,
        evidenceDeficit: 0,
        ecosystemSynergy: 0,
        totalScore: 25,
        explanation: "Verified match.",
      },
      relatedCandidateSkills: [],
    },
    {
      canonicalName: "JavaScript",
      category: "Languages",
      status: "MATCH",
      importance: "Required",
      candidateProficiency: "Strong",
      requiredProficiency: "Strong",
      candidateConfidence: 90,
      evidenceCount: 3,
      evidenceSummary: "Core language powering professional employment and full-stack projects.",
      gapRationale: "Clear match with deep hands-on background.",
      suggestedAction: "Pair JavaScript strength with strict TypeScript demonstrations.",
      priority: "Low",
      priorityScore: 25,
      priorityRationale: "[Score: 25/100 • Low Priority] Core required language fully verified.",
      priorityFactors: {
        requirementWeight: 25,
        proficiencyDeficit: 0,
        evidenceDeficit: 0,
        ecosystemSynergy: 0,
        totalScore: 25,
        explanation: "Verified match.",
      },
      relatedCandidateSkills: [],
    },
  ],
  optionalGaps: [
    {
      canonicalName: "AWS",
      category: "Cloud/DevOps",
      status: "OPTIONAL_GAP",
      importance: "Preferred",
      candidateProficiency: "Not Detected",
      requiredProficiency: "Intermediate",
      candidateConfidence: 0,
      evidenceCount: 0,
      evidenceSummary: "No AWS cloud signals detected in resume.",
      gapRationale: "Preferred skill; not a strict blocker for initial screening.",
      suggestedAction: "Deploy DevPulse to AWS ECS or S3/CloudFront as a weekend learning exercise.",
      priority: "Medium",
      priorityScore: 50,
      priorityRationale:
        "[Score: 50/100 • Medium Priority] Preferred role qualification (+15 pts), Zero demonstrated proficiency (+30 pts), Zero evidence (+15 pts). Synergy with Docker (+10 pts).",
      priorityFactors: {
        requirementWeight: 15,
        proficiencyDeficit: 30,
        evidenceDeficit: 15,
        ecosystemSynergy: 10,
        totalScore: 50,
        explanation: "Preferred qualification with medium priority.",
      },
      relatedCandidateSkills: ["Docker"],
    },
    {
      canonicalName: "GraphQL",
      category: "Backend",
      status: "OPTIONAL_GAP",
      importance: "Preferred",
      candidateProficiency: "Not Detected",
      requiredProficiency: "Intermediate",
      candidateConfidence: 0,
      evidenceCount: 0,
      evidenceSummary: "No GraphQL schemas or queries detected in resume.",
      gapRationale: "Preferred skill; RESTful background covers the primary backend requirement.",
      suggestedAction: "Understand GraphQL query patterns compared to REST endpoints for interview readiness.",
      priority: "Medium",
      priorityScore: 45,
      priorityRationale:
        "[Score: 45/100 • Medium Priority] Preferred role qualification (+15 pts), Zero demonstrated proficiency (+30 pts), Zero evidence (+15 pts).",
      priorityFactors: {
        requirementWeight: 15,
        proficiencyDeficit: 15,
        evidenceDeficit: 15,
        ecosystemSynergy: 0,
        totalScore: 45,
        explanation: "Preferred qualification.",
      },
      relatedCandidateSkills: [],
    },
  ],
  generatedAt: "2026-10-02T10:20:00.000Z",
};

export const sampleResumeOptimization: ResumeOptimizationReport = {
  id: "opt_sample_01",
  resumeId: "resume_sample_01",
  jobId: "jd_sample_01",
  targetRole: "Senior Full Stack Engineer",
  company: "Acme Cloud Platform",
  originalResumeSummary: {
    candidateName: "Alex Morgan",
    sectionsPresent: [
      "Professional Summary",
      "Skills",
      "Work Experience",
      "Projects",
      "Education & Certifications",
    ],
    bulletCount: 6,
    skillsMentionedCount: 14,
    rawExcerpt:
      "Alex Morgan - Full Stack Software Engineer with 3+ years of experience architecting web applications using modern JavaScript/TypeScript, React, and Node.js REST APIs. Built developer analytics dashboards and microservices.",
  },
  bulletImprovements: [
    {
      id: "bullet-opt-1",
      originalBullet: "Architected a responsive dashboard with React 18, React Router, and Tailwind CSS.",
      improvedBullet:
        "Architected responsive developer analytics dashboard utilizing React 18, TypeScript, and modular Tailwind CSS components, establishing consistent design tokens.",
      targetedSkill: "TypeScript",
      rationale:
        "Highlights your TypeScript implementation and architectural precision rather than generic setup phrasing.",
      evidenceConfirmed: true,
      truthWarning:
        "Only adopt this wording if DevPulse is genuinely authored with TypeScript and typed React components. Consider adding benchmarked metrics ONLY if measured in production.",
      highlightTag: "RECOMMENDED",
      sourceSection: "Project: DevPulse",
    },
    {
      id: "bullet-opt-2",
      originalBullet:
        "Built Express.js backend services handling user authentication and RESTful API endpoints for metrics retrieval.",
      improvedBullet:
        "Engineered Express.js REST API services with JWT authentication middleware and structured controller validation for developer sprint metrics.",
      targetedSkill: "Node.js",
      rationale:
        "Demonstrates middleware design and validation rigor matching Senior Full Stack expectations without inventing metrics.",
      evidenceConfirmed: true,
      truthWarning:
        "Verify that your controller endpoints actually include validation checks before adding this to your resume.",
      highlightTag: "RECOMMENDED",
      sourceSection: "Project: DevPulse",
    },
    {
      id: "bullet-opt-3",
      originalBullet: "Built reusable React components used across 4 internal web applications.",
      improvedBullet:
        "Developed and maintained a shared React component library adopted across 4 internal applications, standardizing UI patterns and state conventions.",
      targetedSkill: "React",
      rationale: "Frames component work in terms of organizational standardization and engineering leverage.",
      evidenceConfirmed: true,
      highlightTag: "RECOMMENDED",
      sourceSection: "Work Experience: TechCorp",
    },
  ],
  poorlyRepresentedSkills: [
    {
      id: "poor-docker-1",
      skill: "Docker",
      category: "Cloud/DevOps",
      highlightTag: "WEAK_EVIDENCE",
      currentResumeContext: "Listed as 'Docker (Basic)' in Skills section; absent from all experience bullets and project descriptions.",
      whyPoorlyRepresented: "The target job requires Docker containerization for local dev and CI/CD pipelines. An isolated buzzword fails to demonstrate container networking or Compose configuration.",
      recommendation: "If you containerized DevPulse or CloudCart, describe the multi-stage Dockerfile or docker-compose setup.",
      evidenceRequiredNote: "Do NOT invent fictitious projects or container claims. Build a working docker-compose setup before adding to resume.",
    },
    {
      id: "poor-graphql-1",
      skill: "GraphQL",
      category: "Backend",
      highlightTag: "WEAK_EVIDENCE",
      currentResumeContext: "Appears only as an isolated bullet in CloudCart without schema design details.",
      whyPoorlyRepresented: "The role emphasizes schema design and resolvers. Merely stating 'worked with GraphQL' leaves technical interviewers unsure of query optimization ability.",
      recommendation: "Clarify whether you wrote resolvers, mutation queries, or schema definitions in CloudCart.",
      evidenceRequiredNote: "Consider adding GraphQL query optimization details ONLY if you have actually implemented them.",
    },
  ],
  projectImprovements: [
    {
      id: "proj-imp-1",
      projectName: "DevPulse Analytics Dashboard",
      currentSummary: "Architected a responsive dashboard with React 18, React Router, and Tailwind CSS.",
      targetedSkills: ["React", "TypeScript", "State Architecture"],
      highlightTag: "RECOMMENDED",
      suggestedEnhancement: "Clarify the state management approach (Context API or Redux Toolkit) and how telemetry metrics are fetched and cached.",
      truthCheckNote: "Requires verified implementation—do not claim unbuilt features, unmeasured metrics, or fictional scale.",
      evidenceRequiredNote: "Only describe real-time WebSocket streams or custom cache invalidation if they exist in your repository.",
    },
    {
      id: "proj-imp-2",
      projectName: "CloudCart E-Commerce Platform",
      currentSummary: "Engineered full-stack microservices with Express.js, PostgreSQL, and Stripe integration.",
      targetedSkills: ["Node.js", "PostgreSQL", "Database Architecture"],
      highlightTag: "RECOMMENDED",
      suggestedEnhancement: "Highlight the relational database schema design, transactions for payment processing, and JWT authentication middleware.",
      truthCheckNote: "Do not invent fictitious concurrency figures or fictional high-traffic claims.",
      evidenceRequiredNote: "Describe schema foreign keys and ACID transaction boundaries if implemented in your PostgreSQL repository.",
    },
  ],
  sectionRecommendations: [
    {
      id: "sec-rec-1",
      sectionName: "Professional Summary",
      highlightTag: "RECOMMENDED",
      currentEvaluation: "Current summary exists but could be more tightly aligned to Senior Full Stack expectations.",
      recommendedChange: "Refocus the summary to highlight 3+ years specializing in TypeScript, React, and modular Node.js REST services.",
      truthCheckNote: "State actual experience level truthfully without inflating to 'Principal/Lead'.",
    },
    {
      id: "sec-rec-2",
      sectionName: "Skills Section",
      highlightTag: "RECOMMENDED",
      currentEvaluation: "Currently a flat list of 14 skills without separation of proficiency or domain.",
      recommendedChange: "Restructure into distinct categories (Languages, Frontend, Backend, Databases, Tools) and separate verified competencies from developing skills.",
      truthCheckNote: "Do not include technologies simply to game ATS parsers.",
    },
    {
      id: "sec-rec-3",
      sectionName: "Work Experience",
      highlightTag: "RECOMMENDED",
      currentEvaluation: "Bullet points describe activities rather than engineering outcomes.",
      recommendedChange: "Adopt the Action Verb + Context + Outcome framework, highlighting shared component libraries and API contracts.",
      truthCheckNote: "Never fabricate percentage improvements (e.g. 'boosted performance by 40%') unless backed by production monitoring.",
    },
    {
      id: "sec-rec-4",
      sectionName: "Projects",
      highlightTag: "RECOMMENDED",
      currentEvaluation: "Projects demonstrate full-stack breadth, but could benefit from direct links and architecture diagrams.",
      recommendedChange: "Include public GitHub repository links and concise architecture summaries for DevPulse and CloudCart.",
      truthCheckNote: "Only share repositories containing code you wrote yourself.",
    },
    {
      id: "sec-rec-5",
      sectionName: "Education & Certifications",
      highlightTag: "MATCHED",
      currentEvaluation: "B.S. in Computer Science is clearly documented and matches JD qualifications.",
      recommendedChange: "Keep education concise; consider adding verified cloud certifications once completed.",
      truthCheckNote: "Only list completed credentials.",
    },
  ],
  skillsSectionRecommendation: {
    highlightTag: "RECOMMENDED",
    layoutStyle: "Categorized Two-Tier Grid (Core Competencies vs Familiar Technologies)",
    categories: [
      {
        categoryName: "Languages",
        verifiedSkills: ["JavaScript", "TypeScript"],
        developingSkills: ["Python"],
      },
      {
        categoryName: "Frontend",
        verifiedSkills: ["React", "HTML5", "CSS3 / Tailwind"],
        developingSkills: ["Next.js"],
      },
      {
        categoryName: "Backend & Databases",
        verifiedSkills: ["Node.js", "Express.js", "PostgreSQL", "REST APIs"],
        developingSkills: ["GraphQL", "Redis"],
      },
      {
        categoryName: "Cloud & DevOps",
        verifiedSkills: ["Git / GitHub"],
        developingSkills: ["Docker", "AWS", "CI/CD"],
      },
    ],
    formattingAdvice:
      "Position target JD skills (TypeScript, React, Node.js, PostgreSQL) at the top of each category. Distinguish verified core competencies from tools you are actively learning.",
    antiFabricationRule:
      "Never copy the entire JD requirements into your skills section. It creates immediate credibility loss during technical screens.",
  },
  jdAlignmentRecommendations: [
    {
      id: "align-rec-1",
      title: "Senior Full Stack Technical Alignment",
      targetJobExpectation: "Demonstrate strong proficiency in TypeScript, React, and Node.js REST services.",
      alignmentSuggestion:
        "Highlight your verified React component architecture and Express middleware in your topmost experience bullets.",
      highlightTag: "RECOMMENDED",
      truthCheckNote: "Focus on your authentic strengths rather than pretending to be an expert in every secondary requirement.",
    },
    {
      id: "align-rec-2",
      title: "Addressing Containerization (Docker)",
      targetJobExpectation: "The role requires Docker for local development and microservice deployment.",
      alignmentSuggestion:
        "Do not add unverified Docker claims to your resume. Build a working docker-compose setup for DevPulse first, and discuss this during technical screens as an active project.",
      highlightTag: "MISSING",
      truthCheckNote: "Interviewers appreciate transparency about ramp-up projects over ungrounded resume claims.",
    },
  ],
  truthfulRecommendations: [
    {
      id: "rec-truth-1",
      category: "missing_jd_skills",
      title: "Do not fabricate Docker containerization",
      description:
        "The JD explicitly requires Docker for development and deployment. Your resume currently only lists 'Docker (Basic)' without project proof.",
      truthCheckNote:
        "Never add 'Implemented production Docker containers' unless you have personally configured container networking and Dockerfiles.",
      suggestedAction:
        "Create a working Dockerfile and docker-compose.yml for DevPulse first. Test it locally, commit it to GitHub, and only then add the verified bullet.",
      highlightTag: "MISSING",
    },
    {
      id: "rec-truth-2",
      category: "project_strengthening",
      title: "Write unit tests for authentication logic",
      description:
        "Automated testing is a primary filter for this Senior role. Demonstrating test coverage on auth or data aggregation will significantly strengthen your candidacy.",
      truthCheckNote: "Do not claim '100% test coverage' or invent test suites that do not exist.",
      suggestedAction:
        "Add 5-10 Vitest tests covering JWT generation, token verification, and 401 response handling in CloudCart.",
      highlightTag: "RECOMMENDED",
    },
    {
      id: "rec-truth-3",
      category: "demonstrated_skills",
      title: "Clarify TypeScript depth across existing projects",
      description:
        "You listed TypeScript in your skills section, but neither DevPulse nor CloudCart explicitly mentions typed interfaces in their descriptions.",
      truthCheckNote:
        "If you wrote plain JavaScript with JSDoc, do not claim TypeScript mastery. If you used .tsx files, make it explicit.",
      suggestedAction:
        "Update the project technology tag from 'JavaScript' to 'TypeScript' on projects where .ts/.tsx was actually utilized.",
      highlightTag: "MATCHED",
    },
  ],
  keywordCoverage: [
    {
      keyword: "React",
      category: "Frontend",
      status: "matched",
      highlightTag: "MATCHED",
      importance: "Required",
      evidenceSnippet: "Architected a responsive dashboard with React 18, React Router...",
    },
    {
      keyword: "JavaScript",
      category: "Languages",
      status: "matched",
      highlightTag: "MATCHED",
      importance: "Required",
      evidenceSnippet: "Full Stack Software Engineer with 3+ years using JavaScript...",
    },
    {
      keyword: "Node.js",
      category: "Backend",
      status: "matched",
      highlightTag: "MATCHED",
      importance: "Required",
      evidenceSnippet: "Built Express.js backend services handling user authentication...",
    },
    {
      keyword: "REST APIs",
      category: "Backend",
      status: "matched",
      highlightTag: "MATCHED",
      importance: "Required",
      evidenceSnippet: "RESTful API endpoints for metrics retrieval",
      synonymMatchedWith: "RESTful APIs",
    },
    {
      keyword: "TypeScript",
      category: "Languages",
      status: "partial",
      highlightTag: "RECOMMENDED",
      importance: "Required",
      evidenceSnippet: "Listed in skills section; missing from project bullet points",
      evidenceRequiredNote: "Evidence required before claiming Senior proficiency: demonstrate strict tsconfig usage and generic interfaces.",
    },
    {
      keyword: "Docker",
      category: "Cloud/DevOps",
      status: "weak_evidence",
      highlightTag: "WEAK_EVIDENCE",
      importance: "Required",
      evidenceSnippet: "Listed as 'Docker (Basic)' with no implementation evidence",
      evidenceRequiredNote: "Do not add unverified claims; only elaborate if you have actually configured Dockerfiles or compose setups.",
    },
    {
      keyword: "Kubernetes",
      category: "Cloud/DevOps",
      status: "missing",
      highlightTag: "MISSING",
      importance: "Required",
      evidenceRequiredNote: "Evidence required before adding to resume: Complete a verifiable hands-on project or tutorial using Kubernetes before listing it.",
    },
    {
      keyword: "AWS",
      category: "Cloud/DevOps",
      status: "missing",
      highlightTag: "MISSING",
      importance: "Preferred",
      evidenceRequiredNote: "Evidence required: Only add AWS if you have practical experience configuring services.",
    },
    {
      keyword: "GraphQL",
      category: "Backend",
      status: "missing",
      highlightTag: "MISSING",
      importance: "Preferred",
      evidenceRequiredNote: "Evidence required: Build working resolvers or queries before listing on resume.",
    },
  ],
  truthfulGuidanceRules: [
    "Never fabricate performance percentages (e.g. 'Improved speed by 43%') unless you executed and recorded real benchmarks.",
    "Do not list tools or cloud services you have never personally configured.",
    "Focus resume improvements on clarifying actual technical decisions: middleware, state architecture, and API structure.",
    "Treat gap analysis as a genuine roadmap for skill development, not an invitation to falsify claims.",
  ],
  generatedAt: "2026-10-02T10:25:00.000Z",
};

export const sampleJobSpecificTailoredResume: JobSpecificTailoredResume = {
  id: "tailor_sample_01",
  masterResumeId: "resume_sample_01",
  selectedJobId: "job_sample_01",
  targetRole: "Senior Full Stack Engineer",
  company: "Linear Systems Inc.",
  alignmentSummary: {
    headline: "Strategic Tailoring for Senior Full Stack Engineer at Linear Systems Inc.",
    matchScoreOriginal: 62,
    matchScoreTailored: 89,
    skillsPrioritizedCount: 6,
    projectsPrioritizedCount: 2,
    bulletsImprovedCount: 4,
    irrelevantItemsDeemphasizedCount: 3,
    missingEvidenceCount: 2,
    keyStrategicReasons: [
      "Elevated 6 core required technologies (React, Node.js, TypeScript, REST APIs, Docker, MongoDB) directly matching Linear Systems' primary stack to top priority.",
      "Reordered technical projects to place 'DevPulse — Developer Metrics Platform' (built with React & Node.js) at rank #1 for immediate architectural proof.",
      "Enhanced 4 experience bullet points with active engineering ownership verbs and concrete architectural scope.",
      "De-emphasized 3 low-signal distractions (legacy CSS tricks, routine administrative standup notes, and basic scripting) to sharpen executive review.",
      "Flagged 2 missing requirements (Kubernetes, AWS) transparently without inventing false production claims.",
    ],
    detailedRationale:
      "The Master Resume presents a broad full-stack background that spreads attention across frontend utility tasks and general scripting. Linear Systems requires a Senior Full Stack Engineer focused on sub-second frontend performance, resilient RESTful endpoints, and containerized deployment standards. This tailored version elevates your verified React and Node.js production experience to the top third of the page, highlights your metrics platform project as primary deliverable proof, and cleanly de-emphasizes non-core administrative tasks. All statements are grounded strictly in your verified profile—no metrics or technologies have been fabricated.",
  },
  prioritizedSkills: [
    {
      id: "skill-tailor-1",
      skill: "React.js",
      category: "Frontend",
      status: "core_priority",
      relevanceScore: 98,
      reason: "Directly matches Linear Systems' primary frontend stack requirement. Elevated to top priority.",
      inMaster: true,
      inJobRequired: true,
      inJobPreferred: false,
      highlightTag: "MATCHED",
      decision: "accepted",
    },
    {
      id: "skill-tailor-2",
      skill: "Node.js",
      category: "Backend",
      status: "core_priority",
      relevanceScore: 96,
      reason: "Primary backend runtime demanded in the JD for microservices and event-driven endpoints.",
      inMaster: true,
      inJobRequired: true,
      inJobPreferred: false,
      highlightTag: "MATCHED",
      decision: "accepted",
    },
    {
      id: "skill-tailor-3",
      skill: "TypeScript",
      category: "Programming Languages",
      status: "core_priority",
      relevanceScore: 92,
      reason: "Required language for typed component interfaces and backend server safety.",
      inMaster: true,
      inJobRequired: true,
      inJobPreferred: false,
      highlightTag: "MATCHED",
      decision: "accepted",
    },
    {
      id: "skill-tailor-4",
      skill: "RESTful APIs",
      category: "Backend",
      status: "core_priority",
      relevanceScore: 90,
      reason: "Core responsibility at Linear Systems for high-throughput service communication.",
      inMaster: true,
      inJobRequired: true,
      inJobPreferred: false,
      highlightTag: "MATCHED",
      decision: "accepted",
    },
    {
      id: "skill-tailor-5",
      skill: "Docker",
      category: "DevOps",
      status: "core_priority",
      relevanceScore: 82,
      reason: "Matches containerized deployment standards in the JD.",
      inMaster: true,
      inJobRequired: true,
      inJobPreferred: false,
      highlightTag: "WEAK_EVIDENCE",
      decision: "accepted",
    },
    {
      id: "skill-tailor-6",
      skill: "MongoDB",
      category: "Databases",
      status: "core_priority",
      relevanceScore: 80,
      reason: "Document database utilized in your production experience matching data store needs.",
      inMaster: true,
      inJobRequired: true,
      inJobPreferred: false,
      highlightTag: "MATCHED",
      decision: "accepted",
    },
    {
      id: "skill-tailor-7",
      skill: "Redux Toolkit",
      category: "Frontend",
      status: "secondary",
      relevanceScore: 68,
      reason: "Useful client state management capability. Retained in secondary skills.",
      inMaster: true,
      inJobRequired: false,
      inJobPreferred: false,
      highlightTag: "RELEVANT",
      decision: "accepted",
    },
    {
      id: "skill-tailor-8",
      skill: "Python",
      category: "Programming Languages",
      status: "secondary",
      relevanceScore: 50,
      reason: "General scripting capability. Kept in secondary skills list.",
      inMaster: true,
      inJobRequired: false,
      inJobPreferred: false,
      highlightTag: "RELEVANT",
      decision: "accepted",
    },
    {
      id: "skill-tailor-9",
      skill: "jQuery",
      category: "Frontend",
      status: "de_emphasized",
      relevanceScore: 18,
      reason: "Legacy library not utilized in Linear Systems' modern React stack. De-emphasized to eliminate resume clutter.",
      inMaster: true,
      inJobRequired: false,
      inJobPreferred: false,
      highlightTag: "RELEVANT",
      decision: "accepted",
    },
  ],
  prioritizedProjects: [
    {
      id: "proj-tailor-1",
      projectName: "DevPulse — Developer Metrics Platform",
      originalRank: 1,
      tailoredRank: 1,
      status: "prioritized",
      relevanceScore: 95,
      reason: "Ranked #1 deliverable: directly demonstrates React, TypeScript, Node.js, and Docker—the exact primary stack demanded by Linear Systems.",
      originalDescription:
        "Full-stack telemetry dashboard aggregating GitHub commit velocity, pull request turnaround, and build status in real time.",
      tailoredDescription:
        "Architected full-stack developer observability platform aggregating git metrics and deployment status in real time using React, TypeScript, Node.js, and Docker.",
      originalBullets: [
        "Built responsive dashboard interface using React, TypeScript, and Chart.js",
        "Engineered RESTful API in Node.js/Express consuming GitHub REST and GraphQL APIs with in-memory caching",
        "Configured Docker Compose development environment for reproducible local testing",
      ],
      tailoredBullets: [
        "Architected responsive dashboard interface using React, TypeScript, and Chart.js with client-side caching.",
        "Engineered RESTful API in Node.js/Express consuming GitHub webhooks and REST endpoints with structured error handling.",
        "Configured Docker containerization setup for reproducible local and CI/CD test execution.",
      ],
      targetedJobSkills: ["React", "TypeScript", "Node.js", "Docker", "REST APIs"],
      truthCheckNote: "Accurately reflects verified project deliverables without fabricating benchmark metrics.",
      highlightTag: "MATCHED",
      decision: "accepted",
    },
    {
      id: "proj-tailor-2",
      projectName: "TaskFlow — Collaborative Kanban Board",
      originalRank: 2,
      tailoredRank: 2,
      status: "prioritized",
      relevanceScore: 84,
      reason: "Ranked #2 deliverable: demonstrates multi-user state synchronization, MongoDB transactions, and JWT authentication.",
      originalDescription:
        "Real-time kanban workflow board supporting optimistic UI updates, drag-and-drop task progression, and user role management.",
      tailoredDescription:
        "Engineered real-time collaborative kanban system featuring optimistic UI updates, persistent MongoDB schemas, and role-based access control.",
      originalBullets: [
        "Implemented optimistic UI updates and drag-and-drop task columns using HTML5 Drag and Drop API",
        "Designed normalized MongoDB schema with Mongoose models and validation middleware",
        "Implemented JWT authentication with refresh token rotation and role-based access control",
      ],
      tailoredBullets: [
        "Implemented optimistic UI state updates and interactive drag-and-drop progression in React.",
        "Designed normalized MongoDB schema with Mongoose validation middleware and atomic update operations.",
        "Implemented JWT authentication with refresh token rotation and granular route authorization.",
      ],
      targetedJobSkills: ["React", "MongoDB", "REST APIs", "State Management"],
      truthCheckNote: "No invented real-time socket statistics; focuses on architecture and verified authentication logic.",
      highlightTag: "MATCHED",
      decision: "accepted",
    },
  ],
  tailoredBullets: [
    {
      id: "bullet-tailor-1",
      experienceRole: "Software Engineer",
      experienceCompany: "Vanguard Tech Labs",
      originalBullet:
        "Developed and maintained React components for core SaaS product, improving client-side rendering performance",
      tailoredBullet:
        "Architected and maintained modular React components for core customer-facing SaaS product, optimizing state selectors to minimize unnecessary re-renders.",
      status: "improved",
      reason: "Replaced generic 'developed' with 'architected modular components' and clarified specific state optimization mechanisms.",
      targetedRequirement: "React Performance Optimization",
      truthCheckNote: "Truth constraint: Highlights component architecture without fabricating speed percentage claims.",
      highlightTag: "MATCHED",
      decision: "accepted",
    },
    {
      id: "bullet-tailor-2",
      experienceRole: "Software Engineer",
      experienceCompany: "Vanguard Tech Labs",
      originalBullet:
        "Implemented RESTful API endpoints in Node.js/Express, integrated with MongoDB backend",
      tailoredBullet:
        "Engineered robust RESTful API endpoints using Node.js and Express, implementing centralized error handling, request validation schemas, and MongoDB query optimization.",
      status: "improved",
      reason: "Expands on middleware implementation and query design demanded in Linear Systems' backend responsibilities.",
      targetedRequirement: "RESTful API Engineering",
      truthCheckNote: "Truth constraint: Accurate technical description of Express routing without invented throughput metrics.",
      highlightTag: "MATCHED",
      decision: "accepted",
    },
    {
      id: "bullet-tailor-3",
      experienceRole: "Software Engineer",
      experienceCompany: "Vanguard Tech Labs",
      originalBullet:
        "Wrote unit and integration tests using Jest and React Testing Library, achieving 80%+ coverage across critical paths",
      tailoredBullet:
        "Built automated test suites using Jest and React Testing Library, ensuring regression-proof coverage across core authentication and checkout workflows.",
      status: "improved",
      reason: "Emphasizes automated testing rigor and critical user paths aligned with senior software engineering standards.",
      targetedRequirement: "Automated Testing & Reliability",
      truthCheckNote: "Truth constraint: Preserves verified 80%+ coverage while articulating critical path protection.",
      highlightTag: "MATCHED",
      decision: "accepted",
    },
    {
      id: "bullet-tailor-4",
      experienceRole: "Software Engineer",
      experienceCompany: "Vanguard Tech Labs",
      originalBullet:
        "Assisted team members with daily ticket reviews and attended morning standup meetings",
      tailoredBullet:
        "Assisted team members with daily ticket reviews and attended morning standup meetings.",
      status: "de_emphasized",
      reason: "Routine administrative activity that dilutes technical signal. Recommended to remove from final tailored resume.",
      targetedRequirement: "Technical Signal Maximization",
      truthCheckNote: "Flagged for removal to streamline document length.",
      highlightTag: "RELEVANT",
      decision: "accepted",
    },
  ],
  deemphasizedContent: [
    {
      id: "deemp-tailor-1",
      section: "Work Experience (Vanguard Tech Labs)",
      originalText:
        "Assisted team members with daily ticket reviews and attended morning standup meetings",
      reason: "Administrative routine task with low technical signal for a Senior role.",
      suggestedAction: "remove",
      decision: "accepted",
      highlightTag: "RELEVANT",
    },
    {
      id: "deemp-tailor-2",
      section: "Technical Skills",
      originalText: "jQuery, SVN",
      reason: "Outdated legacy tooling that distracts from modern React & TypeScript capabilities.",
      suggestedAction: "remove",
      decision: "accepted",
      highlightTag: "RELEVANT",
    },
  ],
  missingEvidenceNotices: [
    {
      id: "miss-tailor-1",
      jobRequirement: "Kubernetes",
      importance: "Required",
      evidenceState: "MISSING",
      truthfulGuidance:
        "Linear Systems lists Kubernetes under required cloud standards, but your master profile lacks hands-on cluster evidence. Do not falsely claim Kubernetes orchestration; highlight containerization with Docker and prepare to discuss container lifecycle fundamentals.",
      highlightTag: "MISSING",
    },
    {
      id: "miss-tailor-2",
      jobRequirement: "AWS (ECS, Lambda, S3)",
      importance: "Preferred",
      evidenceState: "MISSING",
      truthfulGuidance:
        "AWS is preferred in the job posting. If you have practical experience deploying services to AWS, document it truthfully; otherwise, emphasize cloud-agnostic containerized workflows.",
      highlightTag: "MISSING",
    },
  ],
  tailoredSummary:
    "Alex Rivera — Senior Full Stack Software Engineer specializing in React, Node.js, and TypeScript, with a proven track record delivering responsive web applications, resilient RESTful endpoints, and containerized architectures. Passionate about developer productivity, maintainable state architectures, and robust automated testing.",
  truthfulGuarantees: [
    "Zero fabricated performance percentages or fictitious latency benchmarks.",
    "Zero fabricated cloud certifications or unverified tool claims.",
    "Re-ordered projects strictly based on documented technology overlap.",
    "Every bullet point enhancement is defensible in a live technical screen.",
  ],
  generatedAt: "2026-10-04T22:00:00.000Z",
};

/**
 * PHASE 8: Precomputed Sample Career Readiness Report
 */
export const sampleCareerReadinessReport: CareerReadinessReport = computeCareerReadiness({
  matrix: sampleSkillMatrix,
  resume: sampleResume,
  job: sampleJobDescription,
  gapReport: sampleGapAnalysis,
});

/**
 * PHASE 9: Precomputed Sample Interview Session & History
 */
export const sampleInterviewQuestions = generateInterviewQuestions({
  resume: sampleResume,
  matrix: sampleSkillMatrix,
  job: sampleJobDescription,
  gapReport: sampleGapAnalysis,
  customCount: 5,
});

export const sampleInterviewSession: InterviewSessionState = {
  id: "sim-sample-session-01",
  resumeId: sampleResume.id,
  jobId: sampleJobDescription.id,
  jobTitle: sampleJobDescription.title,
  company: sampleJobDescription.company || "Linear Systems Inc.",
  status: "in_progress",
  currentStepIndex: 0,
  totalSteps: sampleInterviewQuestions.length,
  currentQuestion: sampleInterviewQuestions[0],
  plannedQuestions: sampleInterviewQuestions,
  exchanges: [],
  finalReport: null,
  createdAt: "2026-10-04T22:30:00.000Z",
  updatedAt: "2026-10-04T22:30:00.000Z",
};

export const sampleInterviewHistory: InterviewHistoryItem[] = [
  {
    id: "sim-hist-01",
    jobTitle: "Senior Full-Stack Engineer",
    company: "Linear Systems Inc.",
    status: "completed",
    overallScore: 88,
    completedQuestionsCount: 4,
    totalQuestionsCount: 4,
    createdAt: "2026-10-03T16:00:00.000Z",
    completedAt: "2026-10-03T16:25:00.000Z",
  },
  {
    id: "sim-hist-02",
    jobTitle: "Staff Platform Engineer",
    company: "Vanguard Tech Labs",
    status: "completed",
    overallScore: 79,
    completedQuestionsCount: 3,
    totalQuestionsCount: 3,
    createdAt: "2026-09-28T11:15:00.000Z",
    completedAt: "2026-09-28T11:35:00.000Z",
  },
];

export const sampleProjectRecommendations: ProjectRecommendationReport = generateProjectRecommendations({
  matrix: sampleSkillMatrix,
  job: sampleJobDescription,
  gapReport: sampleGapAnalysis,
});

export const sampleProjectBlueprint: ProjectBlueprint = generateProjectBlueprint(
  sampleProjectRecommendations.projects[0]
);



