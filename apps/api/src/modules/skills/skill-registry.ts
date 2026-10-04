import type {
  CanonicalSkillDefinition,
  SkillCategory,
} from "@skilltwin/contracts";

/**
 * Built-in canonical developer skill definitions with standard ecosystem aliases,
 * technology partnerships, and evidence expectations.
 */
const DEFAULT_SKILL_DEFINITIONS: CanonicalSkillDefinition[] = [
  // --- Programming Languages ---
  {
    id: "lang-javascript",
    canonicalName: "JavaScript",
    category: "Languages",
    aliases: ["JS", "js", "ES6", "ES6+", "ES2015+", "ECMAScript"],
    description: "Core programming language of the modern web.",
    ecosystemPartners: ["TypeScript", "React", "Node.js", "HTML5", "CSS3"],
    evidenceExpectations: ["Modern async/await code", "Browser DOM or Node.js execution"],
  },
  {
    id: "lang-typescript",
    canonicalName: "TypeScript",
    category: "Languages",
    aliases: ["TS", "ts", "Type-Script"],
    description: "Typed superset of JavaScript with compile-time type safety.",
    ecosystemPartners: ["JavaScript", "React", "Next.js", "Node.js", "NestJS"],
    evidenceExpectations: ["Strict type declarations", "Generic types and interfaces"],
  },
  {
    id: "lang-python",
    canonicalName: "Python",
    category: "Languages",
    aliases: ["Py", "py", "Python3", "python3"],
    description: "Versatile language widely used in backend, data engineering, and AI.",
    ecosystemPartners: ["FastAPI", "Django", "Flask", "Pandas", "PostgreSQL"],
    evidenceExpectations: ["Production scripts or API services", "Python package management"],
  },
  {
    id: "lang-java",
    canonicalName: "Java",
    category: "Languages",
    aliases: ["Java8", "Java11", "Java17", "Java21", "Core Java"],
    description: "Class-based, object-oriented language for enterprise applications.",
    ecosystemPartners: ["Spring Boot", "Maven", "Gradle", "PostgreSQL"],
    evidenceExpectations: ["Spring enterprise services", "Unit tests with JUnit"],
  },
  {
    id: "lang-cpp",
    canonicalName: "C++",
    category: "Languages",
    aliases: ["CPP", "cpp", "C/C++", "C Plus Plus"],
    description: "High-performance systems programming language.",
    ecosystemPartners: ["Linux", "Data Structures", "Algorithms"],
    evidenceExpectations: ["Memory management and systems level programming"],
  },
  {
    id: "lang-go",
    canonicalName: "Go",
    category: "Languages",
    aliases: ["Golang", "golang", "Go Lang"],
    description: "Statically typed, compiled language engineered by Google for concurrent distributed services.",
    ecosystemPartners: ["Docker", "Kubernetes", "gRPC", "PostgreSQL"],
    evidenceExpectations: ["Goroutine concurrency", "Microservice or CLI development"],
  },
  {
    id: "lang-rust",
    canonicalName: "Rust",
    category: "Languages",
    aliases: ["RustLang", "rustlang"],
    description: "Memory-safe systems programming language without garbage collection.",
    ecosystemPartners: ["WebAssembly", "Linux"],
    evidenceExpectations: ["Borrow checker mastery and high-concurrency implementations"],
  },
  {
    id: "lang-csharp",
    canonicalName: "C#",
    category: "Languages",
    aliases: ["CSharp", "c-sharp", "c#", ".NET", "DotNet"],
    description: "Modern, object-oriented language developed by Microsoft for the .NET platform.",
    ecosystemPartners: ["SQL Server", "Azure", "Entity Framework"],
    evidenceExpectations: ["ASP.NET Core backend or enterprise service implementation"],
  },
  {
    id: "lang-html5",
    canonicalName: "HTML5",
    category: "Languages",
    aliases: ["HTML", "html", "html5", "Semantic HTML"],
    description: "Standard markup language for documents designed to be displayed in web browsers.",
    ecosystemPartners: ["CSS3", "JavaScript", "React"],
    evidenceExpectations: ["Semantic markup and accessibility standards"],
  },
  {
    id: "lang-css3",
    canonicalName: "CSS3",
    category: "Languages",
    aliases: ["CSS", "css", "css3", "Sass", "SCSS"],
    description: "Style sheet language used for describing the presentation of a document.",
    ecosystemPartners: ["HTML5", "Tailwind CSS", "React"],
    evidenceExpectations: ["Responsive design, Flexbox, and CSS Grid layouts"],
  },
  {
    id: "lang-sql",
    canonicalName: "SQL",
    category: "Languages",
    aliases: ["Structured Query Language", "ANSI SQL"],
    description: "Standard domain-specific language for managing relational databases.",
    ecosystemPartners: ["PostgreSQL", "MySQL", "Prisma"],
    evidenceExpectations: ["Complex joins, indexing, and query optimization"],
  },
  {
    id: "lang-shell",
    canonicalName: "Shell",
    category: "Languages",
    aliases: ["Bash", "bash", "Zsh", "zsh", "Shell Scripting", "sh"],
    description: "Unix shell command language for scripting and system administration.",
    ecosystemPartners: ["Linux", "Docker", "Git"],
    evidenceExpectations: ["Automated deployment or build scripts"],
  },

  // --- Frontend Frameworks & Libraries ---
  {
    id: "front-react",
    canonicalName: "React",
    category: "Frontend",
    aliases: ["React.js", "ReactJS", "React-JS", "React.JS", "React-DOM", "React-Dom", "reactjs", "react.js"],
    description: "Declarative component-based UI library developed by Meta.",
    ecosystemPartners: ["Next.js", "TypeScript", "Tailwind CSS", "Redux", "React Router"],
    evidenceExpectations: ["Custom hooks, component hierarchy, and state management"],
  },
  {
    id: "front-nextjs",
    canonicalName: "Next.js",
    category: "Frontend",
    aliases: ["NextJS", "Next.JS", "Next", "next.js", "nextjs", "Next-JS"],
    description: "Production React framework for server-rendered and statically generated applications.",
    ecosystemPartners: ["React", "TypeScript", "Tailwind CSS", "Vercel"],
    evidenceExpectations: ["App Router or Pages Router, SSR, and API route design"],
  },
  {
    id: "front-vue",
    canonicalName: "Vue.js",
    category: "Frontend",
    aliases: ["Vue", "VueJS", "Vue.js", "Vue3", "vuejs", "vue.js", "Vue-JS"],
    description: "Progressive JavaScript framework for building user interfaces.",
    ecosystemPartners: ["TypeScript", "Pinia", "Vite"],
    evidenceExpectations: ["Composition API, Vue Router, and reactive state stores"],
  },
  {
    id: "front-angular",
    canonicalName: "Angular",
    category: "Frontend",
    aliases: ["AngularJS", "Angular.js", "Angular2+", "Angular 2+"],
    description: "Comprehensive TypeScript-based open-source framework by Google.",
    ecosystemPartners: ["TypeScript", "RxJS"],
    evidenceExpectations: ["Dependency injection, RxJS observables, and modular architecture"],
  },
  {
    id: "front-tailwind",
    canonicalName: "Tailwind CSS",
    category: "Frontend",
    aliases: ["Tailwind", "TailwindCSS", "tailwind", "tailwindcss", "Tailwind-CSS"],
    description: "Utility-first CSS framework for rapid UI development.",
    ecosystemPartners: ["React", "Next.js", "Vue.js"],
    evidenceExpectations: ["Custom design system tokens and responsive utilities"],
  },
  {
    id: "front-redux",
    canonicalName: "Redux",
    category: "Frontend",
    aliases: ["Redux Toolkit", "RTK", "redux", "redux-toolkit"],
    description: "Predictable state container for JavaScript applications.",
    ecosystemPartners: ["React", "TypeScript"],
    evidenceExpectations: ["Redux Toolkit slices, selectors, and async thunks"],
  },

  // --- Backend Frameworks & Platforms ---
  {
    id: "back-nodejs",
    canonicalName: "Node.js",
    category: "Backend",
    aliases: ["NodeJS", "Node", "node.js", "nodejs", "Node-JS"],
    description: "Asynchronous event-driven JavaScript runtime built on Chrome's V8 engine.",
    ecosystemPartners: ["Express.js", "TypeScript", "REST APIs", "PostgreSQL", "MongoDB"],
    evidenceExpectations: ["Non-blocking I/O event loop, stream processing, or REST APIs"],
  },
  {
    id: "back-express",
    canonicalName: "Express.js",
    category: "Backend",
    aliases: ["Express", "ExpressJS", "express.js", "expressjs", "Express-JS"],
    description: "Fast, unopinionated, minimalist web framework for Node.js.",
    ecosystemPartners: ["Node.js", "REST APIs", "JWT Authentication", "MongoDB"],
    evidenceExpectations: ["Middleware chains, routing, and error handling"],
  },
  {
    id: "back-nestjs",
    canonicalName: "NestJS",
    category: "Backend",
    aliases: ["Nest", "Nest.js", "nest.js", "nestjs"],
    description: "Progressive Node.js framework for building efficient, reliable and scalable enterprise server-side applications.",
    ecosystemPartners: ["TypeScript", "Node.js", "PostgreSQL", "Prisma"],
    evidenceExpectations: ["Dependency injection, modules, decorators, and DTO validation"],
  },
  {
    id: "back-django",
    canonicalName: "Django",
    category: "Backend",
    aliases: ["Django REST Framework", "DRF"],
    description: "High-level Python web framework that encourages rapid development and clean, pragmatic design.",
    ecosystemPartners: ["Python", "PostgreSQL"],
    evidenceExpectations: ["ORM models, migrations, and Django REST Framework endpoints"],
  },
  {
    id: "back-fastapi",
    canonicalName: "FastAPI",
    category: "Backend",
    aliases: ["Fast-API", "fastapi"],
    description: "Modern, fast web framework for building APIs with Python based on standard type hints.",
    ecosystemPartners: ["Python", "Pydantic", "PostgreSQL"],
    evidenceExpectations: ["Pydantic schemas, dependency injection, and async endpoints"],
  },
  {
    id: "back-rest",
    canonicalName: "REST APIs",
    category: "Backend",
    aliases: ["REST", "RESTful APIs", "RESTful", "REST API"],
    description: "Architectural style for distributed hypermedia systems.",
    ecosystemPartners: ["Node.js", "Express.js", "PostgreSQL", "FastAPI"],
    evidenceExpectations: ["HTTP status codes, idempotency, and resource modeling"],
  },
  {
    id: "back-graphql",
    canonicalName: "GraphQL",
    category: "Backend",
    aliases: ["GraphQL API", "Apollo", "Apollo Server", "Apollo Client"],
    description: "Query language for APIs and runtime for fulfilling queries with data.",
    ecosystemPartners: ["React", "Node.js", "TypeScript"],
    evidenceExpectations: ["Type schema definition, resolvers, and query batching"],
  },

  // --- Databases ---
  {
    id: "db-postgresql",
    canonicalName: "PostgreSQL",
    category: "Databases",
    aliases: ["Postgres", "postgres", "postgresql", "psql", "Postgre-SQL"],
    description: "Powerful, open source object-relational database system.",
    ecosystemPartners: ["SQL", "Node.js", "Prisma", "Redis", "Docker"],
    evidenceExpectations: ["Relational schemas, indexes, complex joins, and query plans"],
  },
  {
    id: "db-mongodb",
    canonicalName: "MongoDB",
    category: "Databases",
    aliases: ["Mongo", "mongo", "mongodb", "Mongoose"],
    description: "Document-oriented NoSQL database used for high volume data storage.",
    ecosystemPartners: ["Node.js", "Express.js"],
    evidenceExpectations: ["Aggregation pipelines and schema indexing"],
  },
  {
    id: "db-mysql",
    canonicalName: "MySQL",
    category: "Databases",
    aliases: ["My-SQL", "mysql"],
    description: "Open-source relational database management system.",
    ecosystemPartners: ["SQL", "Node.js", "PHP"],
    evidenceExpectations: ["Relational tables, transactions, and indexing"],
  },
  {
    id: "db-redis",
    canonicalName: "Redis",
    category: "Databases",
    aliases: ["Redis Cache", "redis"],
    description: "In-memory data structure store used as a database, cache, streaming engine, and message broker.",
    ecosystemPartners: ["Node.js", "PostgreSQL", "Docker"],
    evidenceExpectations: ["Key-value caching, TTL expiration, or pub/sub patterns"],
  },

  // --- Cloud & DevOps ---
  {
    id: "cloud-docker",
    canonicalName: "Docker",
    category: "Cloud/DevOps",
    aliases: ["Containerization", "Containers", "Docker Engine", "docker"],
    description: "Set of platform-as-a-service products using OS-level virtualization to deliver software in packages called containers.",
    ecosystemPartners: ["Kubernetes", "Linux", "AWS", "CI/CD"],
    evidenceExpectations: ["Multi-stage Dockerfiles and containerized deployments"],
  },
  {
    id: "cloud-kubernetes",
    canonicalName: "Kubernetes",
    category: "Cloud/DevOps",
    aliases: ["K8s", "k8s", "Kube", "kube", "kubernetes"],
    description: "Open-source system for automating deployment, scaling, and management of containerized applications.",
    ecosystemPartners: ["Docker", "Linux", "AWS", "Terraform"],
    evidenceExpectations: ["Deployments, Services, Ingress, and Helm charts"],
  },
  {
    id: "cloud-aws",
    canonicalName: "AWS",
    category: "Cloud/DevOps",
    aliases: ["Amazon Web Services", "AWS Cloud", "Amazon AWS", "aws"],
    description: "Comprehensive, evolving cloud computing platform provided by Amazon.",
    ecosystemPartners: ["Docker", "Terraform", "PostgreSQL"],
    evidenceExpectations: ["S3, ECS, Lambda, IAM, or CloudFront configurations"],
  },
  {
    id: "cloud-gcp",
    canonicalName: "Google Cloud Platform",
    category: "Cloud/DevOps",
    aliases: ["GCP", "Google Cloud", "gcp"],
    description: "Suite of cloud computing services that runs on the same infrastructure that Google uses internally.",
    ecosystemPartners: ["Kubernetes", "Docker"],
    evidenceExpectations: ["Cloud Run, GKE, or Cloud Storage implementations"],
  },
  {
    id: "cloud-azure",
    canonicalName: "Azure",
    category: "Cloud/DevOps",
    aliases: ["Microsoft Azure", "MS Azure", "azure"],
    description: "Cloud computing service operated by Microsoft.",
    ecosystemPartners: ["Docker", "C#"],
    evidenceExpectations: ["Azure App Services, Blob Storage, or AKS"],
  },
  {
    id: "cloud-terraform",
    canonicalName: "Terraform",
    category: "Cloud/DevOps",
    aliases: ["TF", "HashiCorp Terraform", "Infrastructure as Code", "IaC"],
    description: "Infrastructure as code software tool that enables you to safely and predictably create, change, and improve infrastructure.",
    ecosystemPartners: ["AWS", "Docker", "Kubernetes"],
    evidenceExpectations: ["HCL resource declarations, modules, and state management"],
  },
  {
    id: "cloud-cicd",
    canonicalName: "CI/CD",
    category: "Cloud/DevOps",
    aliases: ["GitHub Actions", "GitLab CI", "Continuous Integration", "Continuous Deployment", "Jenkins", "CircleCI"],
    description: "Combined practice of continuous integration and continuous delivery/deployment.",
    ecosystemPartners: ["Docker", "Git", "Automated Testing"],
    evidenceExpectations: ["Automated testing and multi-stage deployment workflows in YAML"],
  },

  // --- Testing ---
  {
    id: "test-automated",
    canonicalName: "Automated Testing",
    category: "Testing",
    aliases: ["Unit Testing", "Integration Testing", "E2E Testing", "Jest", "Vitest", "Cypress", "Playwright", "React Testing Library", "RTL"],
    description: "Execution of software tests automatically to ensure software quality.",
    ecosystemPartners: ["TypeScript", "React", "Node.js"],
    evidenceExpectations: ["Unit, integration, or end-to-end test suites with mock assertions"],
  },

  // --- Cybersecurity ---
  {
    id: "sec-jwt",
    canonicalName: "JWT Authentication",
    category: "Cybersecurity",
    aliases: ["JWT", "JSON Web Token", "JSON Web Tokens", "jwt"],
    description: "Open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information.",
    ecosystemPartners: ["Node.js", "Express.js", "REST APIs"],
    evidenceExpectations: ["Token signing, verification, and expiration handling"],
  },
  {
    id: "sec-oauth",
    canonicalName: "OAuth",
    category: "Cybersecurity",
    aliases: ["OAuth2", "OAuth 2.0", "OpenID Connect", "OIDC"],
    description: "Open standard for access delegation commonly used as a way for Internet users to grant websites or applications access to their information.",
    ecosystemPartners: ["Node.js", "REST APIs"],
    evidenceExpectations: ["Authorization code grants, client credentials, or PKCE flow"],
  },
  {
    id: "sec-owasp",
    canonicalName: "OWASP",
    category: "Cybersecurity",
    aliases: ["OWASP Top 10", "Web Application Security", "AppSec"],
    description: "Methodologies and standards for securing web applications against common vulnerabilities.",
    ecosystemPartners: ["REST APIs", "Node.js"],
    evidenceExpectations: ["SQL injection prevention, XSS mitigation, and sanitization"],
  },

  // --- System Design ---
  {
    id: "sys-design",
    canonicalName: "System Design",
    category: "System Design",
    aliases: ["Distributed Systems", "Software Architecture", "High-Level Design", "Microservices Architecture", "Scalability"],
    description: "Process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements.",
    ecosystemPartners: ["Docker", "Kubernetes", "Redis", "PostgreSQL"],
    evidenceExpectations: ["High-throughput service architecture, caching, and database sharding"],
  },

  // --- Tools ---
  {
    id: "tool-git",
    canonicalName: "Git",
    category: "Tools",
    aliases: ["GitHub", "GitLab", "Bitbucket", "Version Control", "git"],
    description: "Distributed version control system designed to handle everything from small to very large projects with speed and efficiency.",
    ecosystemPartners: ["CI/CD", "Shell"],
    evidenceExpectations: ["Branching strategies, pull requests, and commit histories"],
  },
  {
    id: "tool-linux",
    canonicalName: "Linux",
    category: "Tools",
    aliases: ["Ubuntu", "Debian", "CentOS", "Alpine", "Unix"],
    description: "Family of open-source Unix-like operating systems based on the Linux kernel.",
    ecosystemPartners: ["Docker", "Shell", "Git"],
    evidenceExpectations: ["Command line navigation, process management, and permissions"],
  },
  {
    id: "tool-postman",
    canonicalName: "Postman",
    category: "Tools",
    aliases: ["Insomnia", "API Client", "Postman Collections"],
    description: "API platform for building and using APIs, streamlining testing and documentation.",
    ecosystemPartners: ["REST APIs"],
    evidenceExpectations: ["Environment variables, automated test scripts, and mock servers"],
  },

  // --- Soft Skills ---
  {
    id: "soft-mentorship",
    canonicalName: "Technical Mentorship",
    category: "Soft Skills",
    aliases: ["Mentorship", "Mentoring", "Mentored engineers", "Engineering Mentorship"],
    description: "Guiding and developing less experienced software engineers.",
    ecosystemPartners: ["Code Reviews"],
    evidenceExpectations: ["Onboarding juniors, 1-on-1 coaching, or architecture guidance"],
  },
  {
    id: "soft-agile",
    canonicalName: "Agile / Scrum",
    category: "Soft Skills",
    aliases: ["Agile", "Scrum", "Sprint Planning", "Kanban", "Agile Methodology"],
    description: "Iterative approach to project management and software development.",
    ecosystemPartners: ["Git", "Team Collaboration"],
    evidenceExpectations: ["Sprint retrospectives, daily standups, and backlog grooming"],
  },
  {
    id: "soft-code-reviews",
    canonicalName: "Code Reviews",
    category: "Soft Skills",
    aliases: ["Code Review", "PR Reviews", "Pull Request Reviews", "Peer Reviews"],
    description: "Systematic examination of computer source code to find bugs and enforce quality.",
    ecosystemPartners: ["Git", "Automated Testing"],
    evidenceExpectations: ["Constructive PR comments, style enforcement, and architectural review"],
  },
  {
    id: "soft-collaboration",
    canonicalName: "Team Collaboration",
    category: "Soft Skills",
    aliases: ["Cross-Functional Collaboration", "Teamwork", "Collaboration", "Stakeholder Communication"],
    description: "Working effectively with designers, product managers, and fellow engineers.",
    ecosystemPartners: ["Agile / Scrum"],
    evidenceExpectations: ["Cross-team coordination, technical RFCs, and product delivery"],
  },
];

/**
 * Extensible Skill Registry
 * Supports runtime registration of new canonical skills and dynamic alias expansion.
 */
export class SkillRegistry {
  private readonly skills: Map<string, CanonicalSkillDefinition> = new Map();
  private readonly aliasIndex: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    DEFAULT_SKILL_DEFINITIONS.forEach((def) => {
      this.registerSkill(def);
    });
  }

  /**
   * Registers a new canonical skill definition into the registry.
   * If a skill with this canonical name already exists, it is merged and updated.
   */
  registerSkill(def: CanonicalSkillDefinition): void {
    const canonicalKey = def.canonicalName.toLowerCase();
    this.skills.set(canonicalKey, def);

    // Index canonical name as an exact alias pointing to itself
    this.aliasIndex.set(canonicalKey, def.canonicalName);

    // Index all aliases
    def.aliases.forEach((alias: string) => {
      this.registerAlias(def.canonicalName, alias);
    });
  }

  /**
   * Associates an additional alias with an existing canonical skill.
   */
  registerAlias(canonicalName: string, alias: string): void {
    const canonicalKey = canonicalName.toLowerCase();
    const existing = this.skills.get(canonicalKey);
    if (!existing) {
      throw new Error(`Cannot register alias "${alias}" for unknown canonical skill "${canonicalName}".`);
    }

    const normalizedAlias = alias.toLowerCase().trim();
    this.aliasIndex.set(normalizedAlias, existing.canonicalName);

    // Also store alias in definition if not already present
    if (!existing.aliases.some((a: string) => a.toLowerCase() === normalizedAlias)) {
      existing.aliases.push(alias);
    }
  }

  /**
   * Look up canonical definition by canonical name (case-insensitive).
   */
  getSkill(canonicalName: string): CanonicalSkillDefinition | undefined {
    return this.skills.get(canonicalName.toLowerCase());
  }

  /**
   * Resolve an alias to its canonical name if present in the index.
   */
  resolveAlias(alias: string): string | undefined {
    return this.aliasIndex.get(alias.toLowerCase().trim());
  }

  /**
   * Retrieve all canonical skills in the registry.
   */
  getAllSkills(): CanonicalSkillDefinition[] {
    return Array.from(this.skills.values());
  }

  /**
   * Retrieve skills filtered by category.
   */
  getSkillsByCategory(category: SkillCategory): CanonicalSkillDefinition[] {
    return this.getAllSkills().filter((s) => s.category === category);
  }

  /**
   * Best-effort category heuristic for uncataloged skills.
   */
  inferCategory(name: string): SkillCategory {
    const lower = name.toLowerCase();
    if (lower.includes("db") || lower.includes("sql") || lower.includes("mongo") || lower.includes("store")) return "Databases";
    if (lower.includes("react") || lower.includes("vue") || lower.includes("front") || lower.includes("css") || lower.includes("ui")) return "Frontend";
    if (lower.includes("node") || lower.includes("express") || lower.includes("api") || lower.includes("back") || lower.includes("server")) return "Backend";
    if (lower.includes("docker") || lower.includes("cloud") || lower.includes("aws") || lower.includes("ci") || lower.includes("ops")) return "Cloud/DevOps";
    if (lower.includes("test") || lower.includes("jest") || lower.includes("cypress") || lower.includes("qa")) return "Testing";
    if (lower.includes("security") || lower.includes("jwt") || lower.includes("auth") || lower.includes("crypto")) return "Cybersecurity";
    if (lower.includes("system") || lower.includes("architecture") || lower.includes("distributed")) return "System Design";
    if (lower.includes("lead") || lower.includes("team") || lower.includes("agile") || lower.includes("mentor") || lower.includes("scrum")) return "Soft Skills";
    if (lower.includes("git") || lower.includes("linux") || lower.includes("tool") || lower.includes("ide")) return "Tools";
    return "Languages";
  }
}

export const skillRegistry = new SkillRegistry();
