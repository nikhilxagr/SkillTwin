import { z } from "zod";
import type { ResumeExtraction } from "./resume.js";
import type { JobSpecificTailoredResume } from "./tailoring.js";

/**
 * LaTeX Resume Compilation & Multi-Template Generation Contracts
 *
 * Designed for 100% free compilation, Overleaf-style editing,
 * and 100% ATS-friendly single-column machine-readable parsing.
 */

export const latexTemplateIdSchema = z.enum([
  "jakes-resume",
  "minimal-ats",
  "executive-standard",
]);
export type LatexTemplateId = z.infer<typeof latexTemplateIdSchema>;

export const latexFontSchema = z.enum([
  "computer-modern",
  "helvetica",
  "times",
]);
export type LatexFontId = z.infer<typeof latexFontSchema>;

export const latexMarginSchema = z.enum([
  "compact",
  "normal",
  "spacious",
]);
export type LatexMargin = z.infer<typeof latexMarginSchema>;

export const latexCompileRequestSchema = z.object({
  texSource: z.string().min(10, "LaTeX source must be at least 10 characters"),
  documentTitle: z.string().optional(),
  engine: z.enum(["pdflatex", "xelatex"]).default("pdflatex"),
});
export type LatexCompileRequest = z.infer<typeof latexCompileRequestSchema>;

export const latexCompileResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  pdfBase64: z.string().optional(),
  engineUsed: z.string(),
  log: z.string().optional(),
  compileDurationMs: z.number().int().nonnegative().optional(),
  message: z.string().optional(),
});
export type LatexCompileResponse = z.infer<typeof latexCompileResponseSchema>;

export const latexGenerateRequestSchema = z.object({
  templateId: latexTemplateIdSchema.default("jakes-resume"),
  font: latexFontSchema.default("computer-modern"),
  margin: latexMarginSchema.default("normal"),
  documentTitle: z.string().optional(),
});
export type LatexGenerateRequest = z.infer<typeof latexGenerateRequestSchema>;

export interface PageBudgetEstimate {
  estimatedLines: number;
  estimatedPages: number;
  totalPoints: number;
  status: "optimal-one-page" | "risk-overflow" | "two-pages-plus";
  message: string;
  recommendation: string;
  bulletCount: number;
  experienceCount: number;
  projectCount: number;
}

/**
 * Computes content density and predicts whether the resume fits on 1 page or risks a 2nd page spill.
 */
export function calculateResumePageBudget(
  resume: ResumeExtraction,
  options?: {
    templateId?: LatexTemplateId;
    margin?: LatexMargin;
    tailored?: JobSpecificTailoredResume | null;
  }
): PageBudgetEstimate {
  const margin = options?.margin || "normal";
  const templateId = options?.templateId || "jakes-resume";

  // Usable vertical points per US Letter page (792pt)
  const pageCapacity = margin === "compact" ? 742 : margin === "spacious" ? 698 : 720;

  let points = 0;
  let lines = 0;

  // Header (name, contact info)
  points += 55;
  lines += 3;

  // Executive summary if template or resume has one
  if (templateId === "executive-standard" || resume.profile?.summary) {
    points += 45;
    lines += 3;
  }

  // Education section
  const eduCount = (resume.education || []).length || 1;
  points += 25;
  points += eduCount * 28;
  lines += 1 + eduCount * 2;

  // Experience section
  const exps = resume.experience || [];
  let bulletCount = 0;
  if (exps.length > 0) {
    points += 25;
    lines += 1;
    exps.forEach((exp, idx) => {
      points += 26;
      lines += 1;
      let bullets = exp.bullets || [];
      if (options?.tailored?.tailoredBullets && idx === 0) {
        bullets = options.tailored.tailoredBullets.map((b) => b.tailoredBullet);
      }
      const bSlice = bullets.slice(0, 4);
      bulletCount += bSlice.length;
      for (const b of bSlice) {
        const bLines = Math.ceil(b.length / 85) || 1;
        lines += bLines;
        points += bLines * 14 + 2;
      }
    });
  }

  // Projects section
  const projs = resume.projects || [];
  if (projs.length > 0) {
    points += 25;
    lines += 1;
    projs.forEach((proj) => {
      points += 24;
      lines += 1;
      const bSlice = (proj.bullets || [proj.description || "Delivered full-stack system."]).slice(0, 3);
      bulletCount += bSlice.length;
      for (const b of bSlice) {
        const bLines = Math.ceil(b.length / 85) || 1;
        lines += bLines;
        points += bLines * 14 + 2;
      }
    });
  }

  // Technical Skills section
  points += 55;
  lines += 4;

  const estimatedPages = points <= pageCapacity ? 1 : Math.ceil(points / pageCapacity);
  const spillThreshold = pageCapacity * 0.94; // within 6% of page break

  let status: PageBudgetEstimate["status"] = "optimal-one-page";
  let message = "Clean single-page ATS layout.";
  let recommendation = "Content density is optimal for recruiters and automated ATS screeners.";

  if (points > pageCapacity * 1.05) {
    status = "two-pages-plus";
    message = `Spans across ${estimatedPages} full pages.`;
    recommendation = "Standard multi-page format for senior / lead engineers with extensive experience.";
  } else if (points > spillThreshold) {
    status = "risk-overflow";
    message = "Content is near page boundary (~3-5 lines risk overflowing to page 2).";
    recommendation = "Switch to 'Compact' margin or trim 1-2 bullet points to guarantee a clean 1-page fit.";
  }

  return {
    estimatedLines: lines,
    estimatedPages,
    totalPoints: Math.round(points),
    status,
    message,
    recommendation,
    bulletCount,
    experienceCount: exps.length,
    projectCount: projs.length,
  };
}

/**
 * Escapes reserved LaTeX characters to avoid compilation syntax errors
 * and normalizes common Unicode punctuation (smart quotes, dashes, bullets).
 */
export function escapeLatex(text: string): string {
  if (!text) return "";
  return text
    // Normalize quotes & punctuation commonly pasted from Word / Google Docs / LinkedIn
    .replace(/[–—]/g, "--")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/•/g, "*")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Reserved LaTeX special characters
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}");
}

function getFontPreamble(font: LatexFontId = "computer-modern"): string {
  switch (font) {
    case "helvetica":
      return `\\usepackage[scaled=0.92]{helvet}\n\\renewcommand{\\familydefault}{\\sfdefault}`;
    case "times":
      return `\\usepackage{mathptmx}`;
    case "computer-modern":
    default:
      return `% Computer Modern Default`;
  }
}

function getMarginAdjustments(margin: LatexMargin = "normal"): string {
  switch (margin) {
    case "compact":
      return `% Compact Margins for maximum 1-page content density
\\addtolength{\\oddsidemargin}{-0.65in}
\\addtolength{\\evensidemargin}{-0.65in}
\\addtolength{\\textwidth}{1.3in}
\\addtolength{\\topmargin}{-.65in}
\\addtolength{\\textheight}{1.3in}`;
    case "spacious":
      return `% Spacious Margins for executive clarity
\\addtolength{\\oddsidemargin}{-0.35in}
\\addtolength{\\evensidemargin}{-0.35in}
\\addtolength{\\textwidth}{0.7in}
\\addtolength{\\topmargin}{-.35in}
\\addtolength{\\textheight}{0.7in}`;
    case "normal":
    default:
      return `% Standard ATS Margins (0.5in)
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}`;
  }
}

/**
 * Generates an ATS-friendly, single-column LaTeX resume document
 * supporting multiple industry templates (Jake's Resume, Minimalist ATS, Executive Standard).
 */
export function generateLatexFromResume(
  resume: ResumeExtraction,
  options?: {
    templateId?: LatexTemplateId;
    font?: LatexFontId;
    margin?: LatexMargin;
    tailored?: JobSpecificTailoredResume | null;
  }
): string {
  const templateId = options?.templateId || "jakes-resume";
  const defaultFont: LatexFontId = templateId === "minimal-ats" ? "helvetica" : "computer-modern";
  const font = options?.font || defaultFont;
  const margin = options?.margin || "normal";

  const profile = resume.profile || ({} as any);
  const name = escapeLatex(profile.name || "Software Engineer");
  const email = profile.email || "";
  const location = escapeLatex(profile.location || "");
  const github = profile.githubUrl || "";
  const linkedin = profile.linkedinUrl || "";

  // Contact links
  const contactParts: string[] = [];
  if (location) contactParts.push(location);
  if (email) contactParts.push(`\\href{mailto:${email}}{\\underline{${escapeLatex(email)}}}`);
  if (linkedin) {
    const cleanLi = linkedin.replace(/^https?:\/\/(www\.)?/, "");
    contactParts.push(`\\href{${linkedin}}{\\underline{${escapeLatex(cleanLi)}}}`);
  }
  if (github) {
    const cleanGh = github.replace(/^https?:\/\/(www\.)?/, "");
    contactParts.push(`\\href{${github}}{\\underline{${escapeLatex(cleanGh)}}}`);
  }
  const contactLine = contactParts.join(" $|$ ");

  // Technical Skills categorization
  const skills = resume.skillsClaimed || [];
  const languagesList = skills
    .filter((s) => /javascript|typescript|python|java|c\+\+|golang|rust|ruby|php|html|css|sql/i.test(s))
    .map(escapeLatex);
  const frameworksList = skills
    .filter((s) => /react|node|express|next|vue|angular|django|flask|spring|fastapi|tailwind/i.test(s))
    .map(escapeLatex);
  const toolsList = skills
    .filter((s) => /docker|git|aws|kubernetes|linux|redis|mongodb|postgres|jest|vitest|graphql|rest/i.test(s))
    .map(escapeLatex);
  const otherSkills = skills
    .filter((s) => !languagesList.includes(escapeLatex(s)) && !frameworksList.includes(escapeLatex(s)) && !toolsList.includes(escapeLatex(s)))
    .map(escapeLatex);

  const finalLanguages = languagesList.length > 0 ? languagesList.join(", ") : "JavaScript, TypeScript, Python, HTML/CSS";
  const finalFrameworks = frameworksList.length > 0 ? frameworksList.join(", ") : "React, Node.js, Express, Tailwind CSS";
  const finalTools = toolsList.length > 0 ? toolsList.join(", ") : "Git, Docker, MongoDB, PostgreSQL, REST APIs, Jest";

  // Experience entries
  let experienceSection = "";
  if (resume.experience && resume.experience.length > 0) {
    const experienceBlocks = resume.experience.map((exp, idx) => {
      const company = escapeLatex(exp.company || "Technology Company");
      const role = escapeLatex(exp.role || "Software Engineer");
      const duration = escapeLatex((exp as any).duration || (exp.startDate && exp.endDate ? `${exp.startDate} -- ${exp.endDate}` : exp.startDate || "2022 -- Present"));
      const loc = escapeLatex(exp.location || "Remote / Hybrid");

      // If tailored bullets exist for this role or index, use them
      let bullets = exp.bullets || [];
      if (options?.tailored?.tailoredBullets && options.tailored.tailoredBullets.length > 0 && idx === 0) {
        bullets = options.tailored.tailoredBullets.map((b: { tailoredBullet: string }) => b.tailoredBullet);
      }

      const validBullets = (bullets.length > 0)
        ? bullets
        : ["Contributed to core product features and engineering deliverables."];

      const items = validBullets
        .slice(0, 4)
        .map((b) => `      \\resumeItem{${escapeLatex(b)}}`)
        .join("\n");

      return `    \\resumeSubheading
      {${role}}{${duration}}
      {${company}}{${loc}}
      \\resumeItemListStart
${items}
      \\resumeItemListEnd`;
    }).join("\n\n");

    experienceSection = `
%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
${experienceBlocks}
  \\resumeSubHeadingListEnd
`;
  }

  // Project entries
  let projectsSection = "";
  if (resume.projects && resume.projects.length > 0) {
    const projectBlocks = resume.projects.map((proj) => {
      const pName = escapeLatex(proj.name || "Engineering Project");
      const techStack = (proj.technologies || []).map(escapeLatex).join(", ");
      const ghUrl = proj.githubUrl || "";
      const pTitle = ghUrl
        ? `\\textbf{${pName}} $|$ \\emph{${techStack}} $|$ \\href{${ghUrl}}{\\underline{Repository}}`
        : `\\textbf{${pName}} $|$ \\emph{${techStack}}`;

      const rawBullets = (proj.bullets && proj.bullets.length > 0)
        ? proj.bullets
        : [proj.description || "Architected and delivered production application."];

      const items = rawBullets
        .slice(0, 3)
        .map((b) => `      \\resumeItem{${escapeLatex(b)}}`)
        .join("\n");

      return `    \\resumeProjectHeading
      {${pTitle}}{}
      \\resumeItemListStart
${items}
      \\resumeItemListEnd`;
    }).join("\n\n");

    projectsSection = `
%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart
${projectBlocks}
  \\resumeSubHeadingListEnd
`;
  }

  // Education entries
  const rawEducation = (resume.education && resume.education.length > 0)
    ? resume.education
    : [
        {
          institution: "University of Technology",
          degree: "Bachelor of Science in Computer Science",
          startDate: "2018",
          endDate: "2022",
          fieldOfStudy: "Computer Science",
        },
      ];

  const educationBlocks = rawEducation.map((edu) => {
    const school = escapeLatex(edu.institution || "University");
    const degree = escapeLatex(edu.degree || "B.S. in Computer Science");
    const dur = escapeLatex((edu as any).duration || (edu.startDate && edu.endDate ? `${edu.startDate} -- ${edu.endDate}` : edu.startDate || "2018 -- 2022"));
    const loc = escapeLatex((edu as any).location || edu.fieldOfStudy || "");

    return `    \\resumeSubheading
      {${school}}{${loc}}
      {${degree}}{${dur}}`;
  }).join("\n\n");

  const educationSection = `
%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${educationBlocks}
  \\resumeSubHeadingListEnd
`;

  // Template-specific header, summary, and section styling
  let headerBlock = "";
  let summarySection = "";
  let sectionFormat = "";
  let templateComment = "";

  if (templateId === "minimal-ats") {
    templateComment = "% Template: Minimalist ATS (Swiss Typography, Sans-Serif, High Readability)";
    headerBlock = `%----------MINIMALIST HEADING----------
\\begin{flushleft}
    {\\Huge \\textbf{${name}}} \\\\ \\vspace{2pt}
    \\small ${contactLine}
\\end{flushleft}`;
    sectionFormat = `\\titleformat{\\section}{
  \\vspace{-3pt}\\bfseries\\raggedright\\small\\uppercase
}{}{0em}{}[\\color{black!30}\\titlerule \\vspace{-4pt}]`;
  } else if (templateId === "executive-standard") {
    templateComment = "% Template: Executive Standard (Leadership Focus, Scope & Core Competencies)";
    headerBlock = `%----------EXECUTIVE HEADING----------
\\begin{center}
    {\\Huge \\textbf{\\scshape ${name}}} \\\\ \\vspace{2pt}
    \\small ${contactLine}
\\end{center}`;
    summarySection = `
%-----------EXECUTIVE SUMMARY-----------
\\section{Executive Profile \\& Core Competencies}
\\small{${escapeLatex(profile.summary || "Senior Technical Leader with demonstrated success architecting resilient cloud systems, driving cross-functional engineering deliverables, and aligning technological investments with critical business objectives.")}}
\\vspace{4pt}
`;
    sectionFormat = `\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\bfseries\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]`;
  } else {
    // Default: Jake's Resume
    templateComment = "% Template: Jake's Resume (Single-Column, Machine-Readable Unicode)";
    headerBlock = `%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    \\small ${contactLine}
\\end{center}`;
    sectionFormat = `\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]`;
  }

  // Assemble full LaTeX source code
  return `%-------------------------
% Resume in Latex - ATS Optimized
% Generated by SkillTwin Career Intelligence Studio
${templateComment}
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
${getFontPreamble(font)}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

${getMarginAdjustments(margin)}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Section formatting
${sectionFormat}

% Ensure that generated pdf is machine readable and ATS parsable
\\pdfgentounicode=1

% Custom resume commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

${headerBlock}
${summarySection}
${educationSection}
${experienceSection}
${projectsSection}
%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: ${finalLanguages}} \\\\
     \\textbf{Frameworks}{: ${finalFrameworks}} \\\\
     \\textbf{Developer Tools \\& Cloud}{: ${finalTools}}
     ${otherSkills.length > 0 ? `\\\\ \n     \\textbf{Additional Competencies}{: ${otherSkills.join(", ")}}` : ""}
    }}
 \\end{itemize}

%-------------------------------------------
\\end{document}
`;
}
