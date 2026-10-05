export type ActiveScreen =
  | "landing"
  | "login"
  | "signup"
  | "verify_email"
  | "forgot_password"
  | "reset_password"
  | "profile"
  | "settings"
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
  | "project_recommendations"
  | "evidence"
  | "latex_studio";

export interface NavigationItem {
  id: ActiveScreen;
  label: string;
  badge?: string;
  category: "core" | "analysis" | "intelligence";
}
