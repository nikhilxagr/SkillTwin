import type {
  InterviewSessionState,
  InterviewHistoryItem,
} from "@skilltwin/contracts";

export class SimulatorRepository {
  private sessions: Map<string, InterviewSessionState> = new Map();
  private latestSessionId: string | null = null;

  saveSession(session: InterviewSessionState): void {
    this.sessions.set(session.id, session);
    this.latestSessionId = session.id;
  }

  getSession(id: string): InterviewSessionState | undefined {
    return this.sessions.get(id);
  }

  getLatestSession(): InterviewSessionState | undefined {
    if (!this.latestSessionId) return undefined;
    return this.sessions.get(this.latestSessionId);
  }

  listSessions(): InterviewSessionState[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  listHistory(): InterviewHistoryItem[] {
    return this.listSessions().map((s) => ({
      id: s.id,
      jobTitle: s.jobTitle,
      company: s.company,
      status: s.status,
      overallScore: s.finalReport?.overallScore ?? null,
      completedQuestionsCount: s.exchanges.length,
      totalQuestionsCount: s.totalSteps,
      createdAt: s.createdAt,
      completedAt: s.finalReport?.completedAt ?? null,
    }));
  }

  clear(): void {
    this.sessions.clear();
    this.latestSessionId = null;
  }
}

export const simulatorRepository = new SimulatorRepository();
