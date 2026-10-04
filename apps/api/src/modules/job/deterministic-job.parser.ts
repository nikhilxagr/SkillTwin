import { aiJobExtractionSchema, type AIJobExtraction, type AIJobSkill } from "./job.schema.js";
import { skillRegistry } from "../skills/skill-registry.js";

export class DeterministicJobParser {
  parse(text: string, fallbackTitle?: string, fallbackCompany?: string): AIJobExtraction {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // 1. Role Title & Company extraction
    let title = fallbackTitle || "";
    let company = fallbackCompany || "";

    if (!title && lines.length > 0) {
      const firstLine = lines[0];
      const titleMatch = firstLine.match(/^(?:Job Title:\s*|Position:\s*|Role:\s*)?([A-Za-z0-9\s/_-]{3,60})/i);
      title = titleMatch ? titleMatch[1].trim() : firstLine.slice(0, 50);
    }
    if (!title) title = "Senior Full-Stack Engineer";

    if (!company) {
      const compMatch = text.match(/(?:at|company:\s*|welcome to\s*)([A-Za-z0-9\s&.,-]{2,40})(?:\s+is hiring|\s+team|\n|$)/i);
      company = compMatch ? compMatch[1].trim() : "Target Technology Organization";
    }

    // 2. Experience Requirements
    const expMatch = text.match(/(\d+)(?:\s*[-–]\s*(\d+))?\+?\s*years?(?:\s*of)?\s*(?:relevant|professional|software|hands-on)?\s*experience/i);
    let minYears = expMatch ? parseInt(expMatch[1], 10) : undefined;
    let maxYears = expMatch && expMatch[2] ? parseInt(expMatch[2], 10) : undefined;

    let level: "Entry" | "Mid" | "Senior" | "Lead" | "NotSpecified" = "NotSpecified";
    const lowerText = text.toLowerCase();
    if (lowerText.includes("senior") || (minYears !== undefined && minYears >= 5)) {
      level = "Senior";
    } else if (lowerText.includes("lead") || lowerText.includes("principal") || lowerText.includes("architect")) {
      level = "Lead";
    } else if (lowerText.includes("mid-level") || lowerText.includes("mid level") || (minYears !== undefined && minYears >= 3)) {
      level = "Mid";
    } else if (lowerText.includes("entry") || lowerText.includes("junior") || (minYears !== undefined && minYears <= 2)) {
      level = "Entry";
    }

    // 3. Education Requirements
    const eduMatch = text.match(/\b(?:Bachelor(?:'s)?|Master(?:'s)?|B\.?S\b|M\.?S\b|Ph\.?D\b|(?:College|University)\s+Degree|Degree\s+in\s+[A-Za-z\s]+)[^\n.]*/i);
    const education = eduMatch ? eduMatch[0].trim() : "Bachelor's degree in Computer Science or equivalent practical experience";

    // 4. Section Splitting: Required vs Preferred vs Responsibilities
    const requiredSectionRegex = /(?:REQUIREMENTS|BASIC QUALIFICATIONS|WHAT YOU(?:'LL)? NEED|MINIMUM QUALIFICATIONS|REQUIRED SKILLS|WHAT WE(?:'RE)? LOOKING FOR|MUST HAVE|MANDATORY)([\s\S]*?)(?=(?:PREFERRED|NICE[\s-]TO[\s-]HAVE|BONUS|BENEFITS|PERKS|RESPONSIBILITIES|WHAT YOU(?:'LL)? DO|$))/i;
    const preferredSectionRegex = /(?:PREFERRED(?:\s+(?:QUALIFICATIONS|SKILLS))?|NICE[\s-]TO[\s-]HAVE|BONUS(?:\s+POINTS)?|DESIRED(?:\s+SKILLS)?|PLUS)([\s\S]*?)(?=(?:BENEFITS|PERKS|ABOUT US|EQUAL OPPORTUNITY|RESPONSIBILITIES|$))/i;
    const responsibilitiesSectionRegex = /(?:RESPONSIBILITIES|WHAT YOU(?:'LL)? DO|DUTIES|KEY DELIVERABLES|THE ROLE)([\s\S]*?)(?=(?:REQUIREMENTS|QUALIFICATIONS|WHAT YOU(?:'LL)? NEED|BENEFITS|$))/i;

    const reqMatch = text.match(requiredSectionRegex);
    const prefMatch = text.match(preferredSectionRegex);
    const respMatch = text.match(responsibilitiesSectionRegex);

    const requiredText = reqMatch ? reqMatch[1] : (prefMatch ? text.slice(0, prefMatch.index) : text);
    const preferredText = prefMatch ? prefMatch[1] : "";
    const respText = respMatch ? respMatch[1] : "";

    // 5. Responsibilities bullets
    const responsibilities: string[] = [];
    if (respText) {
      const respLines = respText.split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of respLines) {
        if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
          const clean = line.replace(/^[•\-*]\s*/, "");
          if (clean.length > 10) responsibilities.push(clean);
        }
      }
    }
    if (responsibilities.length === 0) {
      responsibilities.push(
        "Design, build, and maintain high-performance, testable web services and client applications.",
        "Participate in technical architecture reviews and contribute to codebase scalability.",
        "Collaborate with product, engineering, and design teams to deliver end-to-end features."
      );
    }

    // 6. Qualifications bullets
    const qualifications: string[] = [];
    if (requiredText) {
      const reqLines = requiredText.split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of reqLines) {
        if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
          const clean = line.replace(/^[•\-*]\s*/, "");
          if (clean.length > 8) qualifications.push(clean);
        }
      }
    }

    // 7. Skill Detection & Importance Classification
    const allRegisteredSkills = skillRegistry.getAllSkills();
    const requiredSkills: AIJobSkill[] = [];
    const preferredSkills: AIJobSkill[] = [];

    const categorizedSkills = {
      programmingLanguages: [] as string[],
      frameworks: [] as string[],
      libraries: [] as string[],
      databases: [] as string[],
      tools: [] as string[],
      cloudDevOps: [] as string[],
      cybersecurity: [] as string[],
      softSkills: [] as string[],
    };

    const sentences = text
      .replace(/\n+/g, ". ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    for (const def of allRegisteredSkills) {
      const terms = [def.canonicalName, ...def.aliases];
      const pattern = new RegExp(`\\b(?:${terms.map(escapeRegExp).join("|")})\\b`, "i");

      const inPreferred = preferredText.length > 0 && pattern.test(preferredText);
      const inRequired = pattern.test(requiredText);
      const inOverall = pattern.test(text);

      if (inPreferred || inRequired || inOverall) {
        // Find matching context sentence
        const contextSentence = sentences.find((s) => pattern.test(s)) || `Demonstrated competency in ${def.canonicalName}.`;

        const isRequired = inPreferred ? false : (reqMatch ? inRequired : true);
        const importance = isRequired ? "Required" : "Preferred";

        const skillItem: AIJobSkill = {
          name: def.canonicalName,
          importance,
          minimumProficiency: level === "Senior" || level === "Lead" ? "Strong" : "Intermediate",
          contextSentence,
        };

        if (isRequired) {
          if (!requiredSkills.some((s) => s.name === def.canonicalName)) {
            requiredSkills.push(skillItem);
          }
        } else {
          if (!preferredSkills.some((s) => s.name === def.canonicalName)) {
            preferredSkills.push(skillItem);
          }
        }

        // Add to categorized bucket
        switch (def.category) {
          case "Languages":
            if (!categorizedSkills.programmingLanguages.includes(def.canonicalName)) {
              categorizedSkills.programmingLanguages.push(def.canonicalName);
            }
            break;
          case "Frontend":
          case "Backend":
            if (!categorizedSkills.frameworks.includes(def.canonicalName)) {
              categorizedSkills.frameworks.push(def.canonicalName);
            }
            break;
          case "Databases":
            if (!categorizedSkills.databases.includes(def.canonicalName)) {
              categorizedSkills.databases.push(def.canonicalName);
            }
            break;
          case "Cloud/DevOps":
            if (!categorizedSkills.cloudDevOps.includes(def.canonicalName)) {
              categorizedSkills.cloudDevOps.push(def.canonicalName);
            }
            break;
          case "Testing":
          case "Tools":
            if (!categorizedSkills.tools.includes(def.canonicalName)) {
              categorizedSkills.tools.push(def.canonicalName);
            }
            break;
          case "Cybersecurity":
            if (!categorizedSkills.cybersecurity.includes(def.canonicalName)) {
              categorizedSkills.cybersecurity.push(def.canonicalName);
            }
            break;
          case "Soft Skills":
            if (!categorizedSkills.softSkills.includes(def.canonicalName)) {
              categorizedSkills.softSkills.push(def.canonicalName);
            }
            break;
        }
      }
    }

    // Baseline fallback skills if JD text was extremely sparse
    if (requiredSkills.length === 0 && preferredSkills.length === 0) {
      requiredSkills.push(
        { name: "JavaScript", importance: "Required", minimumProficiency: "Strong", contextSentence: "Core JavaScript web development required." },
        { name: "React", importance: "Required", minimumProficiency: "Strong", contextSentence: "Building scalable web interfaces with React." },
        { name: "Node.js", importance: "Required", minimumProficiency: "Intermediate", contextSentence: "Backend services with Node.js." }
      );
      preferredSkills.push(
        { name: "Docker", importance: "Preferred", minimumProficiency: "Intermediate", contextSentence: "Containerized deployment experience is a plus." }
      );
    }

    // 8. Keywords
    const keywords = Array.from(
      new Set([
        ...requiredSkills.map((s) => s.name),
        ...preferredSkills.map((s) => s.name),
        title,
        level,
      ])
    );

    const result: AIJobExtraction = {
      title,
      company,
      location: /remote/i.test(text) ? "Remote" : "Hybrid / On-site",
      experience: {
        minYears: minYears || 3,
        maxYears,
        level,
        description: expMatch ? expMatch[0] : `${minYears || 3}+ years of technical engineering experience`,
      },
      education,
      requiredSkills,
      preferredSkills,
      categorizedSkills,
      responsibilities,
      qualifications: qualifications.length > 0 ? qualifications : [
        `${minYears || 3}+ years of professional engineering experience.`,
        `Proficiency with ${requiredSkills.slice(0, 2).map((s) => s.name).join(" and ")}.`,
      ],
      keywords,
    };

    return aiJobExtractionSchema.parse(result);
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const deterministicJobParser = new DeterministicJobParser();
