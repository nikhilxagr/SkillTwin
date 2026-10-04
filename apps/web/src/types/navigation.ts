export type ActiveScreen =
  | "landing"
  | "dashboard"
  | "resume"
  | "resume_upload"
  | "resume_view"
  | "skills"
  | "skill_matrix"
  | "job_analysis"
  | "jd_upload"
  | "jd_analysis"
  | "gap_analysis"
  | "recommendations"
  | "resume_improvement"
  | "tailored_resume"
  | "interview_simulator"
  | "project_recommendations";

export interface NavigationItem {
  id: ActiveScreen;
  label: string;
  badge?: string;
  category: "core" | "analysis" | "intelligence";
}
