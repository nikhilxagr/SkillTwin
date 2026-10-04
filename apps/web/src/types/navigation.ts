export type ActiveScreen =
  | "landing"
  | "dashboard"
  | "resume_upload"
  | "resume_view"
  | "skill_matrix"
  | "jd_upload"
  | "jd_analysis"
  | "gap_analysis"
  | "resume_improvement";

export interface NavigationItem {
  id: ActiveScreen;
  label: string;
  badge?: string;
  category: "core" | "analysis" | "intelligence";
}
