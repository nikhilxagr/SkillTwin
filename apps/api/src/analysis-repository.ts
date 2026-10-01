import type { AnalysisResult, AnalysisSummary } from "@skilltwin/contracts";

export interface AnalysisRepository {
  save(analysis: AnalysisResult): void;
  get(id: string): AnalysisResult | undefined;
  list(): AnalysisSummary[];
}

export class InMemoryAnalysisRepository implements AnalysisRepository {
  private readonly analyses = new Map<string, AnalysisResult>();

  save(analysis: AnalysisResult): void {
    this.analyses.set(analysis.id, analysis);
  }

  get(id: string): AnalysisResult | undefined {
    return this.analyses.get(id);
  }

  list(): AnalysisSummary[] {
    return [...this.analyses.values()]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(({ id, createdAt, provider, status, evidenceCount }) => ({
        id,
        createdAt,
        provider,
        status,
        evidenceCount,
      }));
  }
}

export const analysisRepository: AnalysisRepository = new InMemoryAnalysisRepository();
