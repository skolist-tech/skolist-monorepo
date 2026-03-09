import { useState, useEffect } from "react";
import type { HardnessLevel } from "@skolist/db";
import {
  DEFAULT_DIFFICULTY_LEVELS,
  SUBJECT_DIFFICULTY_CONFIG,
  type DifficultyDistribution,
} from "../config/question_types_config";

export function useDifficultyLevels(
  subjectName: string,
  restoredLevels: DifficultyDistribution | null
) {
  const [difficultyLevels, setDifficultyLevels] =
    useState<DifficultyDistribution>({ ...DEFAULT_DIFFICULTY_LEVELS });

  useEffect(() => {
    // 1. Resolve Base Config
    // Algorithm:
    // - Check Subject Config. If exists, USE IT.
    // - Else, use Default Config.

    const subjectConfig = SUBJECT_DIFFICULTY_CONFIG[subjectName];

    let baseLevels: DifficultyDistribution = subjectConfig
      ? { ...subjectConfig }
      : { ...DEFAULT_DIFFICULTY_LEVELS };

    // 2. Apply Restoration / Database Overrides
    // If we have restored levels (from DB), they override EVERYTHING.
    if (restoredLevels) {
      (Object.keys(restoredLevels) as HardnessLevel[]).forEach((level) => {
        const val = restoredLevels[level];
        if (val !== undefined && val !== null) {
          baseLevels[level] = val;
        }
      });
    }

    setDifficultyLevels(baseLevels);
  }, [subjectName, restoredLevels]);

  const handleLevelChange = (level: HardnessLevel, value: number) => {
    setDifficultyLevels((prev) => ({ ...prev, [level]: value }));
  };

  return {
    difficultyLevels,
    setDifficultyLevels,
    handleLevelChange,
  };
}
