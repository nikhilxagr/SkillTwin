import {
  generateProjectRecommendations,
  generateProjectBlueprint,
  type ProjectRecommendationInput,
  type ProjectRecommendationReport,
  type ProjectBlueprint,
} from "@skilltwin/contracts";
import { projectRepository } from "./projects.repository.js";

export class ProjectService {
  /**
   * Generates tailored, production-ready project recommendations based on
   * target job, skill matrix, and gap analysis.
   */
  generateRecommendations(input: ProjectRecommendationInput): ProjectRecommendationReport {
    const report = generateProjectRecommendations(input);
    projectRepository.saveReport(report);
    return report;
  }

  /**
   * Retrieves the most recently generated recommendations report.
   */
  getLatestRecommendations(): ProjectRecommendationReport | null {
    return projectRepository.getLatestReport();
  }

  /**
   * Generates or retrieves an in-depth Project Blueprint for a specific recommended project.
   */
  generateBlueprint(projectId: string): ProjectBlueprint {
    const existing = projectRepository.getBlueprintByProjectId(projectId);
    if (existing) {
      return existing;
    }

    const latestReport = projectRepository.getLatestReport();
    const project = latestReport?.projects.find((p) => p.id === projectId);

    if (!project) {
      throw new Error(`Project with ID '${projectId}' not found in latest recommendations.`);
    }

    const blueprint = generateProjectBlueprint(project);
    projectRepository.saveBlueprint(blueprint);
    return blueprint;
  }

  /**
   * Fetches an existing blueprint by project ID.
   */
  getBlueprint(projectId: string): ProjectBlueprint | null {
    return projectRepository.getBlueprintByProjectId(projectId);
  }
}

export const projectService = new ProjectService();
