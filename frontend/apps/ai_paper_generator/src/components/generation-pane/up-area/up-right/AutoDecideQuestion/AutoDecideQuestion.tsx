import type { HardnessLevel } from "@skolist/db";

export interface AutoDecideParams {
  totalQuestions: number;
  totalMarks: number;
  totalTime: number;
  hardnessLevels: Record<HardnessLevel, number>;
  customPrompt: string;
}
