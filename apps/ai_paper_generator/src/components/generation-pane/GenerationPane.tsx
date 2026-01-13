import { useState } from "react";
import { UpArea } from "./up-area";
import { DownArea } from "./down-area";
import type { HardnessLevel } from "@skolist/db";

export function GenerationPane() {
  const [hardnessLevels, setHardnessLevels] = useState<
    Record<HardnessLevel, number>
  >({
    easy: 40,
    medium: 40,
    hard: 20,
  });

  const handleLevelChange = (level: HardnessLevel, value: number) => {
    setHardnessLevels((prev) => ({ ...prev, [level]: value }));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <UpArea
        hardnessLevels={hardnessLevels}
        onHardnessLevelChange={handleLevelChange}
      />
      <DownArea hardnessLevels={hardnessLevels} />
    </div>
  );
}
