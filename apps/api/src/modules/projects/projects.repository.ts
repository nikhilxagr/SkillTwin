import type {
  ProjectRecommendationReport,
  ProjectBlueprint,
} from "@skilltwin/contracts";

export class ProjectRepository {
  private latestReport: ProjectRecommendationReport | null = null;
  private blueprints: Map<string, ProjectBlueprint> = new Map();

  saveReport(report: ProjectRecommendationReport): void {
    this.latestReport = report;
  }

  getLatestReport(): ProjectRecommendationReport | null {
    return this.latestReport;
  }

  saveBlueprint(blueprint: ProjectBlueprint): void {
    this.blueprints.set(blueprint.projectId, blueprint);
  }

  getBlueprintByProjectId(projectId: string): ProjectBlueprint | null {
    return this.blueprints.get(projectId) ?? null;
  }

  clear(): void {
    this.latestReport = null;
    this.blueprints.clear();
  }
}

export const projectRepository = new ProjectRepository();
