import { useState, useRef } from "react";
import { UpArea } from "./up-area/UpArea";
import { DownArea } from "./down-area/DownArea";
import type { HardnessLevel } from "@skolist/db";

export function GenerationPane() {
  const [hardnessLevels, setHardnessLevels] = useState<
    Record<HardnessLevel, number>
  >({
    easy: 40,
    medium: 40,
    hard: 20,
  });

  const [isGenerating, setIsGenerating] = useState(false);
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
        // Calculate position to scroll header to top of container
        const headerRect = headerElement.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();
        const relativeTop = headerRect.top - containerRect.top;
        const targetScrollTop = containerElement.scrollTop + relativeTop - 16; // 16px padding

        containerElement.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const handleGenerateStart = () => {
    setIsGenerating(true);
    handleScrollToQuestions();
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col overflow-y-auto">
      {/* UpArea stays visible during generation */}
      <UpArea
        onHardnessLevelChange={handleLevelChange}
        isGenerating={isGenerating}
        onGenerateStart={handleGenerateStart}
        onGenerateEnd={() => setIsGenerating(false)}
      />
      <DownArea hardnessLevels={hardnessLevels} isGenerating={isGenerating} />
    </div>
  );
}
