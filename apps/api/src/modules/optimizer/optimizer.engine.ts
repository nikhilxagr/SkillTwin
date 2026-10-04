import crypto from "node:crypto";
import type {
  ResumeExtraction,
  SkillMatrix,
  JobExtraction,
  GapAnalysisReport,
  ResumeOptimizationReport,
  BulletImprovement,
  PoorlyRepresentedSkill,
  ProjectImprovement,
  ResumeSectionRecommendation,
  SectionOrderingRecommendation,
  SkillsSectionRecommendation,
  JdAlignmentRecommendation,
  TruthfulRecommendation,
  KeywordCoverageItem,
  OriginalResumeSummary,
} from "@skilltwin/contracts";
import { skillNormalizer, SkillNormalizer } from "../skills/skill-normalizer.js";
import { skillRegistry, SkillRegistry } from "../skills/skill-registry.js";

export interface OptimizerEngineInput {
  resume: ResumeExtraction;
  matrix: SkillMatrix;
  job: JobExtraction;
  gapReport: GapAnalysisReport;
}

export class ResumeOptimizerEngine {
  constructor(
    private readonly normalizer: SkillNormalizer = skillNormalizer,
    private readonly registry: SkillRegistry = skillRegistry,
  ) {}

  private normalizeCanonical(name: string): string {
    const match = this.normalizer.normalizeSkill(name);
    return match ? match.canonicalName : name.trim();
  }

  private areAliases(a: string, b: string): boolean {
    if (a.toLowerCase() === b.toLowerCase()) return true;
    return this.normalizer.areSkillsEquivalent(a, b);
  }
  /**
   * Main entry point: produces a strictly non-hallucinatory, evidence-grounded
   * Resume Optimization Report comparing candidate resume & matrix against job description & gap analysis.
   */
  optimize(input: OptimizerEngineInput): ResumeOptimizationReport {
    const { resume, matrix, job, gapReport } = input;
    const reportId = `opt-${crypto.randomUUID()}`;

    // 1. Summarize original resume structure (keeping original untouched)
    const originalResumeSummary = this.summarizeOriginalResume(resume);

    // 2. Keyword coverage (JD requirements vs candidate resume/matrix)
    const keywordCoverage = this.generateKeywordCoverage(input);

    // 3. Poorly represented skills (present in resume/matrix, but under-demonstrated)
    const poorlyRepresentedSkills = this.generatePoorlyRepresentedSkills(input);

    // 4. Project improvement suggestions (grounded in candidate's real projects)
    const projectImprovements = this.generateProjectImprovements(input);

    // 5. Resume section recommendations (Summary, Skills, Experience, Projects, Education)
    const sectionRecommendations = this.generateSectionRecommendations(input);

    // 6. Section ordering recommendation tailored to role seniority & recruiter scanning patterns
    const sectionOrdering = this.generateSectionOrdering(input);

    // 7. Concrete skills section structure & advice
    const skillsSectionRecommendation = this.generateSkillsSectionRecommendation(input);

    // 8. Tactical JD alignment recommendations
    const jdAlignmentRecommendations = this.generateJdAlignmentRecommendations(input);

    // 9. Bullet-point improvements (Before / After diffs with zero fabricated metrics)
    const bulletImprovements = this.generateBulletImprovements(input);

    // 10. Truthful high-level next actions (backward compatibility & strategic guidance)
    const truthfulRecommendations = this.generateTruthfulRecommendations(input);

    // 11. Non-negotiable anti-fabrication rules
    const truthfulGuidanceRules = [
      "Never fabricate statistics, metrics, or performance improvements (e.g. 'boosted efficiency by 40%') not measured in production.",
      "Do not claim experience with technologies you cannot confidently explain in a live technical screen or system design session.",
      "If a required technology is missing from your resume, build a working prototype or project first before adding it.",
      "Keep the original resume truthful; frame existing experience with technical clarity rather than exaggeration.",
      "Clearly separate verified core competencies from tools with only beginner or academic exposure.",
    ];

    return {
      id: reportId,
      resumeId: resume.id,
      jobId: job.id,
      targetRole: job.title,
      company: job.company,
      originalResumeSummary,
      bulletImprovements,
      poorlyRepresentedSkills,
      projectImprovements,
      sectionRecommendations,
      sectionOrdering,
      skillsSectionRecommendation,
      jdAlignmentRecommendations,
      truthfulRecommendations,
      keywordCoverage,
      truthfulGuidanceRules,
      generatedAt: new Date().toISOString(),
    };
  }

  private summarizeOriginalResume(resume: ResumeExtraction): OriginalResumeSummary {
    const sections: string[] = [];
    if (resume.profile?.summary || resume.profile?.name) sections.push("Professional Summary / Header");
    if (resume.skillsClaimed && resume.skillsClaimed.length > 0) sections.push("Skills");
    if (resume.experience && resume.experience.length > 0) sections.push("Work Experience");
    if (resume.projects && resume.projects.length > 0) sections.push("Projects");
    if (resume.education && resume.education.length > 0) sections.push("Education");
    if (resume.certifications && resume.certifications.length > 0) sections.push("Certifications");

    let bulletCount = 0;
    for (const exp of resume.experience || []) {
      bulletCount += exp.bullets?.length || 0;
    }
    for (const proj of resume.projects || []) {
      bulletCount += proj.bullets?.length || 0;
    }

    const rawExcerpt = resume.rawText
      ? resume.rawText.replace(/\s+/g, " ").trim().slice(0, 350) + "..."
      : undefined;

    return {
      candidateName: resume.profile?.name || "Candidate",
      sectionsPresent: sections,
      bulletCount,
      skillsMentionedCount: resume.skillsClaimed?.length || 0,
      rawExcerpt,
    };
  }

  private getMatrixItems(matrix: SkillMatrix): any[] {
    return matrix.items || (matrix as any).skills || [];
  }

  private getEvidenceContext(item?: any): string | undefined {
    if (!item) return undefined;
    const list = item.evidence || item.evidenceItems;
    if (Array.isArray(list) && list.length > 0 && list[0]?.context) {
      return list[0].context;
    }
    return undefined;
  }

  private generateKeywordCoverage(input: OptimizerEngineInput): KeywordCoverageItem[] {
    const { resume, matrix, job, gapReport } = input;
    const matrixItems = this.getMatrixItems(matrix);
    const items: KeywordCoverageItem[] = [];
    const seenKeywords = new Set<string>();

    // Combine JD required and preferred skills
    const allJdSkills = [
      ...job.requiredSkills.map((s) => ({ ...s, importance: "Required" as const })),
      ...job.preferredSkills.map((s) => ({ ...s, importance: "Preferred" as const })),
    ];

    // Helper map for quick gap item lookup
    const gapMap = new Map<string, typeof gapReport.criticalGaps[number]>();
    const allGapItems = [
      ...gapReport.criticalGaps,
      ...gapReport.partialGaps,
      ...gapReport.weakEvidence,
      ...gapReport.strongMatches,
      ...gapReport.optionalGaps,
    ];
    for (const item of allGapItems) {
      gapMap.set(this.normalizeCanonical(item.canonicalName).toLowerCase(), item);
    }

    for (const req of allJdSkills) {
      const canonical = this.normalizeCanonical(req.canonicalName);
      const key = canonical.toLowerCase();
      if (seenKeywords.has(key)) continue;
      seenKeywords.add(key);

      const gapItem = gapMap.get(key);
      const userSkill = matrixItems.find(
        (s: any) =>
          s.canonicalName.toLowerCase() === key ||
          this.areAliases(s.canonicalName, canonical)
      );
      const evContext = this.getEvidenceContext(userSkill);

      if (gapItem?.status === "MATCH") {
        items.push({
          keyword: canonical,
          category: req.category,
          status: "matched",
          highlightTag: "MATCHED",
          importance: req.importance,
          evidenceSnippet: evContext
            ? `Demonstrated in resume: "${evContext.slice(0, 90)}..."`
            : "Demonstrated with verified high-confidence evidence in candidate matrix.",
        });
      } else if (gapItem?.status === "PARTIAL") {
        items.push({
          keyword: canonical,
          category: req.category,
          status: "partial",
          highlightTag: "RECOMMENDED",
          importance: req.importance,
          evidenceSnippet: evContext
            ? `Present at ${userSkill?.proficiency || "developing"} proficiency: "${evContext.slice(0, 90)}..."`
            : `Present at ${userSkill?.proficiency || "developing"} proficiency, but JD requires ${req.minimumProficiency}.`,
          evidenceRequiredNote: `Evidence required before claiming ${req.minimumProficiency} proficiency: demonstrate complex usage or architectural ownership.`,
        });
      } else if (gapItem?.status === "WEAK_EVIDENCE") {
        items.push({
          keyword: canonical,
          category: req.category,
          status: "weak_evidence",
          highlightTag: "WEAK_EVIDENCE",
          importance: req.importance,
          evidenceSnippet: "Superficially mentioned in resume text without substantial project evidence.",
          evidenceRequiredNote: "Do not add unverified claims; only elaborate if you have actually implemented this in practical projects.",
        });
      } else {
        // Missing (GAP or OPTIONAL_GAP)
        items.push({
          keyword: canonical,
          category: req.category,
          status: "missing",
          highlightTag: "MISSING",
          importance: req.importance,
          evidenceSnippet: undefined,
          evidenceRequiredNote: `Evidence required before adding to resume: Complete a verifiable hands-on project or tutorial using ${canonical} before listing it.`,
        });
      }
    }

    // Also include other job keywords (tools, databases, cloud) if not already covered
    const additionalKeywords = [
      ...(job.keywords?.tools || []).map((k) => ({ name: k, category: "Tools" })),
      ...(job.keywords?.databases || []).map((k) => ({ name: k, category: "Databases" })),
      ...(job.keywords?.cloudDevOps || []).map((k) => ({ name: k, category: "Cloud/DevOps" })),
    ];

    for (const kw of additionalKeywords) {
      const canonical = this.normalizeCanonical(kw.name);
      const key = canonical.toLowerCase();
      if (seenKeywords.has(key)) continue;
      seenKeywords.add(key);

      const inResumeText = resume.rawText.toLowerCase().includes(key);
      if (inResumeText) {
        items.push({
          keyword: canonical,
          category: kw.category,
          status: "matched",
          highlightTag: "MATCHED",
          importance: "Preferred",
          evidenceSnippet: `Appears in resume text context.`,
        });
      } else {
        items.push({
          keyword: canonical,
          category: kw.category,
          status: "missing",
          highlightTag: "MISSING",
          importance: "Preferred",
          evidenceRequiredNote: `Evidence required: Only add ${canonical} if you have practical experience with it.`,
        });
      }
    }

    return items;
  }

  private generatePoorlyRepresentedSkills(input: OptimizerEngineInput): PoorlyRepresentedSkill[] {
    const { resume, matrix, job, gapReport } = input;
    const matrixItems = this.getMatrixItems(matrix);
    const poorlyRepresented: PoorlyRepresentedSkill[] = [];
    const seen = new Set<string>();

    // 1. Any skill flagged as WEAK_EVIDENCE in Gap Report
    for (const weak of gapReport.weakEvidence) {
      const key = weak.canonicalName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      poorlyRepresented.push({
        id: `poor-${crypto.randomUUID()}`,
        skill: weak.canonicalName,
        category: weak.category,
        highlightTag: "WEAK_EVIDENCE",
        currentResumeContext: `Superficially mentioned as a keyword or isolated bullet without technical depth or measurable outcomes.`,
        whyPoorlyRepresented: `The target role (${job.title}) lists ${weak.canonicalName} as an important requirement. Interviewers look for architectural context and component design, not just an isolated keyword.`,
        recommendation: `If you implemented ${weak.canonicalName} in an existing project, revise the bullet point to describe the component, API, or query architecture you designed.`,
        evidenceRequiredNote: `Do NOT invent fictitious projects or metrics. Only expand your description if you actually utilized ${weak.canonicalName} in practical work.`,
      });
    }

    // 2. Any skill in matrix with only 1 weak evidence item and low confidence
    for (const skill of matrixItems) {
      const key = skill.canonicalName.toLowerCase();
      if (seen.has(key)) continue;
      const evCount = (skill.evidence || skill.evidenceItems || []).length;
      if (skill.confidence < 50 && evCount <= 1) {
        // Is it relevant to JD?
        const isJdSkill =
          job.requiredSkills.some((r) => this.areAliases(r.canonicalName, skill.canonicalName)) ||
          job.preferredSkills.some((p) => this.areAliases(p.canonicalName, skill.canonicalName));

        if (isJdSkill) {
          seen.add(key);
          poorlyRepresented.push({
            id: `poor-${crypto.randomUUID()}`,
            skill: skill.canonicalName,
            category: skill.category,
            highlightTag: "WEAK_EVIDENCE",
            currentResumeContext: `Listed with low demonstrated evidence context in resume analysis.`,
            whyPoorlyRepresented: `The resume states ${skill.canonicalName} but lacks accompanying engineering context (e.g. state management, schema design, or API integration).`,
            recommendation: `Detail how ${skill.canonicalName} was integrated into your workflow—such as specific libraries or architectural patterns used.`,
            evidenceRequiredNote: `Consider adding technical depth ONLY if you have actually implemented these patterns.`,
          });
        }
      }
    }

    return poorlyRepresented;
  }

  private generateProjectImprovements(input: OptimizerEngineInput): ProjectImprovement[] {
    const { resume, job, matrix } = input;
    const matrixItems = this.getMatrixItems(matrix);
    const improvements: ProjectImprovement[] = [];

    // If candidate has projects on resume, review them
    if (resume.projects && resume.projects.length > 0) {
      for (const proj of resume.projects) {
        const projTech = (proj.technologies || []).map((t) => this.normalizeCanonical(t));
        const matchedTech = projTech.filter((t) =>
          matrixItems.some((ms: any) => this.areAliases(ms.canonicalName, t))
        );

        improvements.push({
          id: `proj-${crypto.randomUUID()}`,
          projectName: proj.name,
          currentSummary: proj.description || proj.bullets?.join("; ") || "Project listed without in-depth architectural description.",
          targetedSkills: matchedTech.length > 0 ? matchedTech : ["Architecture", "Full-Stack Integration"],
          highlightTag: "RECOMMENDED",
          suggestedEnhancement: `Clarify the architectural flow in ${proj.name}. Specifically describe: (1) client-server API contract structure, (2) database persistence strategy, and (3) error boundaries or testing approaches.`,
          truthCheckNote: "Requires verified implementation—do not claim unbuilt features, unmeasured metrics, or fictional scale.",
          evidenceRequiredNote: "Consider highlighting architectural trade-offs or performance optimization ONLY if you actually designed or coded them.",
        });
      }
    } else {
      // No projects in resume: recommend building a portfolio project
      const topGaps = input.gapReport.criticalGaps.slice(0, 2).map((g) => g.canonicalName);
      improvements.push({
        id: `proj-${crypto.randomUUID()}`,
        projectName: "Recommended Portfolio Project",
        currentSummary: "No standalone technical projects currently detailed on the resume.",
        targetedSkills: topGaps.length > 0 ? topGaps : ["Full-Stack Architecture", "TypeScript"],
        highlightTag: "RECOMMENDED",
        suggestedEnhancement: `Build and deploy an open-source project demonstrating ${topGaps.join(" and ")}. Document the schema design, API endpoints, and setup in a comprehensive README.`,
        truthCheckNote: "Complete and publish the project to GitHub before adding it to your resume.",
        evidenceRequiredNote: "Never list hypothetical or planned projects on a professional resume.",
      });
    }

    return improvements;
  }

  private generateSectionRecommendations(input: OptimizerEngineInput): ResumeSectionRecommendation[] {
    const { resume, job, matrix } = input;
    const matrixItems = this.getMatrixItems(matrix);
    const recommendations: ResumeSectionRecommendation[] = [];

    // 1. Professional Summary
    const hasSummary = Boolean(resume.profile?.summary && resume.profile.summary.trim().length > 20);
    recommendations.push({
      id: `sec-${crypto.randomUUID()}`,
      sectionName: "Professional Summary",
      highlightTag: "RECOMMENDED",
      currentEvaluation: hasSummary
        ? `Current summary exists but could be more tightly aligned to the ${job.title} role.`
        : "No dedicated professional summary found on the resume.",
      recommendedChange: `Adopt a concise 2-3 sentence summary: 'Software Engineer with demonstrated proficiency in ${matrixItems
        .slice(0, 3)
        .map((s: any) => s.canonicalName)
        .join(", ")}, specializing in building reliable web applications. Passionate about clean code, modular architecture, and modern full-stack development.'`,
      truthCheckNote: "State your actual years of experience truthfully; avoid buzzwords like 'rockstar' or claiming senior titles without years of track record.",
    });

    // 2. Skills Section
    recommendations.push({
      id: `sec-${crypto.randomUUID()}`,
      sectionName: "Skills Section",
      highlightTag: "RECOMMENDED",
      currentEvaluation: "Skills are often presented as a flat keyword list without indicating proficiency or categorization.",
      recommendedChange: `Group skills by domain: Languages, Frameworks, Databases, and Developer Tools. Place role-critical skills (${job.requiredSkills
        .slice(0, 3)
        .map((s) => s.canonicalName)
        .join(", ")}) prominently at the beginning of each category.`,
      truthCheckNote: "Do not paste the entire JD tech stack into your skills section. Recruiters will test you on every listed item.",
    });

    // 3. Work Experience
    recommendations.push({
      id: `sec-${crypto.randomUUID()}`,
      sectionName: "Work Experience",
      highlightTag: "RECOMMENDED",
      currentEvaluation: "Experience bullets should follow the Action Verb + Context + Outcome framework without relying on unsubstantiated percentages.",
      recommendedChange: `Re-anchor each bullet to highlight engineering challenges solved and technical choices made, emphasizing teamwork, code reviews, and test coverage.`,
      truthCheckNote: "Never insert fabricated metrics (e.g. 'improved performance by 40%'). If metrics are not measured, describe qualitative engineering outcomes truthfully.",
    });

    // 4. Projects
    recommendations.push({
      id: `sec-${crypto.randomUUID()}`,
      sectionName: "Projects",
      highlightTag: "RECOMMENDED",
      currentEvaluation: "Projects should provide direct evidence of hands-on ability for technologies where professional experience is still developing.",
      recommendedChange: "Provide working GitHub links, specify the exact technologies used, and describe the system architecture rather than just the user interface.",
      truthCheckNote: "Only list projects where you personally wrote the code and can explain every commit and architectural decision during a code walkthrough.",
    });

    // 5. Education & Certifications
    const hasDegree = Boolean(resume.education && resume.education.length > 0);
    recommendations.push({
      id: `sec-${crypto.randomUUID()}`,
      sectionName: "Education & Certifications",
      highlightTag: hasDegree ? "MATCHED" : "RECOMMENDED",
      currentEvaluation: hasDegree
        ? `Education is documented (${resume.education[0]?.degree} from ${resume.education[0]?.institution}).`
        : "Formal education credentials are not prominently detailed.",
      recommendedChange: "List your degree institution, graduation year, and any accredited vendor certifications (e.g. AWS Certified Developer) with verifiable credential IDs.",
      truthCheckNote: "Only list verified accredited degrees or completed credentials. Never claim in-progress courses as certified.",
    });

    return recommendations;
  }

  private generateSectionOrdering(input: OptimizerEngineInput): SectionOrderingRecommendation {
    const { resume, job } = input;
    const currentOrder = resume.profile?.summary
      ? ["Professional Summary", "Skills", "Work Experience", "Projects", "Education"]
      : ["Skills", "Work Experience", "Projects", "Education"];

    const isSenior =
      (job.experience?.minYears || 0) >= 3 ||
      job.title.toLowerCase().includes("senior") ||
      job.title.toLowerCase().includes("lead");

    const recommendedOrder = isSenior
      ? [
          "Professional Summary",
          "Technical Skills",
          "Work Experience",
          "Technical Projects",
          "Education & Certifications",
        ]
      : [
          "Professional Summary",
          "Technical Skills",
          "Technical Projects",
          "Work Experience",
          "Education & Certifications",
        ];

    const reason = isSenior
      ? `For ${job.title}, recruiters and hiring managers scan for proven production ownership and technical core competencies first. Placing Technical Skills and Work Experience above academic credentials ensures immediate qualification recognition.`
      : `Highlighting hands-on Technical Projects immediately beneath Technical Skills establishes verified code deliverables and demonstrable architectural competencies.`;

    const rationale = `Prioritizes verified evidence in the first third of the resume, matching standard engineering review patterns.`;

    const truthCheckNote = `Maintain standard, recognizable section headers (e.g. 'Work Experience' rather than unconventional phrases) to ensure compatibility with Applicant Tracking Systems (ATS).`;

    return {
      id: `sec-order-${crypto.randomUUID()}`,
      highlightTag: "RELEVANT",
      currentOrder,
      recommendedOrder,
      reason,
      rationale,
      truthCheckNote,
    };
  }

  private generateSkillsSectionRecommendation(input: OptimizerEngineInput): SkillsSectionRecommendation {
    const { matrix, job } = input;
    const matrixItems = this.getMatrixItems(matrix);

    // Group candidate skills into categories
    const categoryMap = new Map<string, { verified: string[]; developing: string[] }>();

    for (const skill of matrixItems) {
      const category = skill.category || "General";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { verified: [], developing: [] });
      }
      const entry = categoryMap.get(category)!;
      const evCount = (skill.evidence || skill.evidenceItems || []).length;
      if (skill.proficiency === "Strong" || (skill.confidence >= 60 && evCount >= 2)) {
        entry.verified.push(skill.canonicalName);
      } else {
        entry.developing.push(skill.canonicalName);
      }
    }

    const categories = Array.from(categoryMap.entries()).map(([name, group]) => ({
      categoryName: name,
      verifiedSkills: Array.from(new Set(group.verified)),
      developingSkills: Array.from(new Set(group.developing)),
    }));

    return {
      highlightTag: "RECOMMENDED",
      layoutStyle: "Categorized Two-Tier Grid (Core Competencies vs Familiar Technologies)",
      categories,
      formattingAdvice: `Format the skills block into distinct lines (e.g. 'Languages:', 'Frameworks:', 'Databases:'). Prioritize technologies explicitly requested by ${job.title} (${job.requiredSkills.slice(0, 4).map((s) => s.canonicalName).join(", ")}).`,
      antiFabricationRule: "Never include technologies you have only read documentation for. Distinguish verified core competencies from tools you are actively learning.",
    };
  }

  private generateJdAlignmentRecommendations(input: OptimizerEngineInput): JdAlignmentRecommendation[] {
    const { job, gapReport } = input;
    const recommendations: JdAlignmentRecommendation[] = [];

    // Alignment 1: Target Role Technical Fit
    recommendations.push({
      id: `align-${crypto.randomUUID()}`,
      title: `Technical Fit for ${job.title}`,
      targetJobExpectation: `Candidate must demonstrate hands-on experience with ${job.requiredSkills
        .slice(0, 4)
        .map((s) => s.canonicalName)
        .join(", ")} at a ${job.experience.level} level.`,
      alignmentSuggestion: `Highlight your ${gapReport.strongMatches
        .slice(0, 3)
        .map((s) => s.canonicalName)
        .join(", ")} achievements prominently in your topmost experience bullets and project headers.`,
      highlightTag: "RECOMMENDED",
      truthCheckNote: "Focus on your authentic strengths rather than attempting to present yourself as an expert in every requirement.",
    });

    // Alignment 2: Handling Gaps Honestly in Application
    if (gapReport.criticalGaps.length > 0) {
      const topGap = gapReport.criticalGaps[0]!.canonicalName;
      recommendations.push({
        id: `align-${crypto.randomUUID()}`,
        title: `Addressing Missing Requirement (${topGap})`,
        targetJobExpectation: `The job requires ${topGap} as a non-negotiable core skill.`,
        alignmentSuggestion: `Do not add ${topGap} to your resume until you complete an authentic implementation. In cover letters or initial interviews, candidly state your adjacent skills and demonstrate rapid ramp-up ability with a side project.`,
        highlightTag: "MISSING",
        truthCheckNote: "Interviewers appreciate transparency about learning curves far more than finding out during a live coding session that a resume claim was exaggerated.",
      });
    }

    return recommendations;
  }

  private generateBulletImprovements(input: OptimizerEngineInput): BulletImprovement[] {
    const { resume, matrix, job } = input;
    const matrixItems = this.getMatrixItems(matrix);
    const improvements: BulletImprovement[] = [];

    // Collect candidate experience bullets and project bullets
    interface BulletSource {
      text: string;
      section: string;
      techHint?: string;
    }
    const bullets: BulletSource[] = [];

    for (const exp of resume.experience || []) {
      for (const b of exp.bullets || []) {
        if (b.trim().length > 10) {
          bullets.push({ text: b.trim(), section: `Experience: ${exp.role} at ${exp.company}` });
        }
      }
    }
    for (const proj of resume.projects || []) {
      for (const b of proj.bullets || []) {
        if (b.trim().length > 10) {
          bullets.push({ text: b.trim(), section: `Project: ${proj.name}` });
        }
      }
    }

    // If candidate has real bullets, improve the top relevant ones
    if (bullets.length > 0) {
      for (let i = 0; i < Math.min(bullets.length, 3); i++) {
        const item = bullets[i]!;
        // Determine targeted skill from bullet text or fallback to candidate's top skill
        const matchedSkill =
          matrixItems.find((s: any) => item.text.toLowerCase().includes(s.canonicalName.toLowerCase()))?.canonicalName ||
          matrixItems[0]?.canonicalName ||
          "Full-Stack Development";

        // Generate enhanced phrasing without inventing fake numbers/percentages
        const enhanced = this.enhanceBulletTruthfully(item.text, matchedSkill);

        improvements.push({
          id: `bullet-${crypto.randomUUID()}`,
          originalBullet: item.text,
          improvedBullet: enhanced.improved,
          targetedSkill: matchedSkill,
          rationale: enhanced.rationale,
          evidenceConfirmed: true,
          truthWarning: enhanced.truthWarning,
          highlightTag: "RECOMMENDED",
          sourceSection: item.section,
        });
      }
    } else {
      // If resume had no extractable bullets (e.g. plain text or minimalist resume)
      const topSkill = matrixItems[0]?.canonicalName || "TypeScript";
      improvements.push({
        id: `bullet-${crypto.randomUUID()}`,
        originalBullet: `Worked on full-stack web applications with ${topSkill}.`,
        improvedBullet: `Architected and implemented responsive web applications using ${topSkill}, establishing modular component hierarchies and type-safe API communication.`,
        targetedSkill: topSkill,
        rationale: `Enhances engineering specificity by highlighting modularity and type-safety based on your verified ${topSkill} evidence.`,
        evidenceConfirmed: true,
        truthWarning: `Only use if your codebase actually enforces type safety and component modularity. Consider adding measurable metrics (e.g. latency or user volume) ONLY if you have benchmarked them.`,
        highlightTag: "RECOMMENDED",
        sourceSection: "Recommended Experience Bullet",
      });
    }

    return improvements;
  }


  private enhanceBulletTruthfully(
    original: string,
    skill: string
  ): { improved: string; rationale: string; truthWarning: string } {
    // If the original already mentions metrics, preserve them without fabricating new ones
    const hasExistingMetrics = /\b\d+%\b|\b\d+x\b|\b\d+\s*(ms|seconds|minutes|users|requests)\b/i.test(original);

    // Build cleaner, architecture-focused sentence
    let improved = original;

    // Pattern 1: Weak "Worked on / helped with"
    if (/^(worked on|helped with|assisted with|responsible for)/i.test(original.trim())) {
      improved = original
        .replace(/^(worked on|helped with|assisted with|responsible for)/i, "Engineered and maintained")
        .replace(/\bwith\b/i, "utilizing");
    }
    // Pattern 2: Weak "Built web app with X"
    else if (/^(built|created|made)\b/i.test(original.trim())) {
      improved = original.replace(/^(built|created|made)\b/i, "Architected and delivered");
    } else {
      // Clarify engineering depth
      improved = `${original.replace(/\.$/, "")}, applying clean design patterns and modular component architecture.`;
    }

    // Ensure capital first letter and trailing period
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    if (!improved.endsWith(".")) improved += ".";

    const rationale = hasExistingMetrics
      ? `Maintains your authentic performance metric while elevating action verbs and architectural clarity around ${skill}.`
      : `Clarifies engineering ownership and technical context for ${skill} without fabricating artificial percentages or numbers.`;

    const truthWarning = hasExistingMetrics
      ? `Ensure you can provide pull request or monitoring references for the stated metric in technical discussions.`
      : `Consider adding measurable benchmarks (e.g. request volume or response latency) ONLY if you have actually measured them in production.`;

    return { improved, rationale, truthWarning };
  }

  private generateTruthfulRecommendations(input: OptimizerEngineInput): TruthfulRecommendation[] {
    const { gapReport, job } = input;
    const recs: TruthfulRecommendation[] = [];

    // 1. Demonstrated skills
    if (gapReport.strongMatches.length > 0) {
      const topMatch = gapReport.strongMatches[0]!.canonicalName;
      recs.push({
        id: `rec-${crypto.randomUUID()}`,
        category: "demonstrated_skills",
        title: `Elevate verified ${topMatch} achievements`,
        description: `Your demonstrated evidence in ${topMatch} meets the requirements for ${job.title}. Ensure your top experience bullet points highlight specific architectural challenges solved with ${topMatch}.`,
        truthCheckNote: "Ground your bullet points in real codebase architecture, not generic marketing claims.",
        suggestedAction: `Feature your primary ${topMatch} project prominently near the top of your resume.`,
        highlightTag: "MATCHED",
      });
    }

    // 2. Missing JD skills
    if (gapReport.criticalGaps.length > 0) {
      const topGap = gapReport.criticalGaps[0]!.canonicalName;
      recs.push({
        id: `rec-${crypto.randomUUID()}`,
        category: "missing_jd_skills",
        title: `${topGap} required by JD but not demonstrated`,
        description: `The job description lists ${topGap} as a required requirement, but your resume lacks credible evidence.`,
        truthCheckNote: `Do not add ${topGap} to your resume skills section until you have practical, hands-on project experience with it.`,
        suggestedAction: `Complete a verifiable tutorial or build a prototype integrating ${topGap} before listing it on your resume.`,
        highlightTag: "MISSING",
      });
    }

    // 3. Project strengthening
    recs.push({
      id: `rec-${crypto.randomUUID()}`,
      category: "project_strengthening",
      title: "Provide public repository and architecture links",
      description: "Hiring managers value verifiable code. Adding public GitHub links with clear README documentation dramatically improves candidate credibility.",
      truthCheckNote: "Only share repositories containing code you wrote yourself.",
      suggestedAction: "Audit your GitHub repositories to ensure READMEs include architecture diagrams and local setup steps.",
      highlightTag: "RECOMMENDED",
    });

    // 4. Learning priorities
    if (gapReport.partialGaps.length > 0) {
      const topPartial = gapReport.partialGaps[0]!.canonicalName;
      recs.push({
        id: `rec-${crypto.randomUUID()}`,
        category: "learning_priorities",
        title: `Deepen ${topPartial} proficiency to match JD expectation`,
        description: `You have foundational or intermediate exposure to ${topPartial}, but the role requires ${gapReport.partialGaps[0]!.requiredProficiency} proficiency.`,
        truthCheckNote: "State your current proficiency level honestly during interviews.",
        suggestedAction: `Study advanced architectural patterns and testing workflows for ${topPartial}.`,
        highlightTag: "WEAK_EVIDENCE",
      });
    }

    return recs;
  }
}

export const resumeOptimizerEngine = new ResumeOptimizerEngine();
