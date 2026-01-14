import { useState, useRef } from "react";
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

  const containerRef = useRef<HTMLDivElement>(null);

  const handleLevelChange = (level: HardnessLevel, value: number) => {
    setHardnessLevels((prev) => ({ ...prev, [level]: value }));
  };

  const handleScrollToQuestions = () => {
    // Small delay to ensure DOM update
    setTimeout(() => {
      const headerElement = document.getElementById(
        "generated-questions-header"
      );
      const containerElement = containerRef.current;

      if (headerElement && containerElement) {
        // Calculate the top position of the header relative to the container
        const headerRect = headerElement.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();

        // Target scroll position: Center the header in the viewport
        // Current scroll + (header top relative to viewport - container top relative to viewport) - (half viewport height - half header height)
        const relativeTop = headerRect.top - containerRect.top;
        const targetScrollTop =
          containerElement.scrollTop +
          relativeTop -
          (containerElement.clientHeight / 2 - headerRect.height / 2);

        containerElement.scrollTo({
          top: Math.max(0, targetScrollTop), // Ensure we don't scroll past top
          behavior: "smooth",
        });
      }
    }, 100);
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col overflow-y-auto">
      <UpArea
        hardnessLevels={hardnessLevels}
        onHardnessLevelChange={handleLevelChange}
        onGenerationComplete={handleScrollToQuestions}
      />
      <DownArea hardnessLevels={hardnessLevels} />
    </div>
  );
}
