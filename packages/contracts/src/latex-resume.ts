import { z } from "zod";
import type { ResumeExtraction } from "./resume.js";
import type { JobSpecificTailoredResume } from "./tailoring.js";

/**
 * LaTeX Resume Compilation & Generation Contracts
 *
 * Designed for 100% free compilation, Overleaf-style editing,
 * and 100% ATS-friendly single-column parsing.
 */

export const latexTemplateIdSchema = z.enum([
  "jakes-resume",
  "minimal-ats",
  "executive-standard",
]);
export type LatexTemplateId = z.infer<typeof latexTemplateIdSchema>;

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
  documentTitle: z.string().optional(),
});
export type LatexGenerateRequest = z.infer<typeof latexGenerateRequestSchema>;

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

/**
 * Generates an ATS-friendly, single-column LaTeX resume document
 * based on the industry-standard "Jake's Resume" template.
 */
export function generateLatexFromResume(
  resume: ResumeExtraction,
  options?: {
    templateId?: LatexTemplateId;
    tailored?: JobSpecificTailoredResume | null;
  }
): string {
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

  // Assemble full Jake's Resume LaTeX source code
  return `%-------------------------
% Resume in Latex - ATS Optimized
% Generated by SkillTwin Career Intelligence Studio
% Template: Jake's Resume (Single-Column, Machine-Readable Unicode)
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
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

% Margins configuration for ATS scanning
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Section formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

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

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    \\small ${contactLine}
\\end{center}
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
