import { useState } from "react";
import { QuestionTypeSelector } from "./QuestionTypeSelector";
import type { AutoDecideParams } from "./AutoDecideQuestion"; // Keeping the type import
import { AutoDecideButton } from "./AutoDecideQuestion/AutoDecideButton";
import { HardnessLevelSliders } from "./AutoDecideQuestion/HardnessLevelSliders";
import { PromptBox } from "./AutoDecideQuestion/PromptBox";
import { TotalInputs } from "./AutoDecideQuestion/TotalInputs";
import type { QuestionType, HardnessLevel } from "@skolist/db";
// import { Separator } from "@skolist/ui";

interface UpRightAreaProps {
  questionCounts: Record<QuestionType, number>;
  onQuestionCountChange: (type: QuestionType, count: number) => void;
  onAutoDecide: (params: AutoDecideParams) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function UpRightArea({
  questionCounts,
  onQuestionCountChange,
  onAutoDecide,
  onGenerate,
  isGenerating,
}: UpRightAreaProps) {
  // Lifted state from AutoDecideQuestion
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [totalMarks, setTotalMarks] = useState(30);
  const [totalTime, setTotalTime] = useState(60);
  const [customPrompt, setCustomPrompt] = useState("");
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

  const handleAutoDecide = () => {
    onAutoDecide({
      totalQuestions,
      totalMarks,
      totalTime,
      hardnessLevels,
      customPrompt,
    });
  };

  const isAutoDecideValid =
    totalQuestions > 0 &&
    totalMarks > 0 &&
    totalTime > 0 &&
    hardnessLevels.easy + hardnessLevels.medium + hardnessLevels.hard === 100;

  return (
    <div className="h-full w-full space-y-6 overflow-y-auto px-4 lg:max-w-5xl lg:px-6">
      {/* 1] Top three selectors, arranged horizontally */}
      <TotalInputs
        totalQuestions={totalQuestions}
        totalMarks={totalMarks}
        totalTime={totalTime}
        onTotalQuestionsChange={setTotalQuestions}
        onTotalMarksChange={setTotalMarks}
        onTotalTimeChange={setTotalTime}
      />

      {/* <Separator /> */}

      {/* 2, 3, 4, 5, 6] Difficulty Section (Header, Auto Button, Slider, %, Counts) */}
      <HardnessLevelSliders
        levels={hardnessLevels}
        onLevelChange={handleLevelChange}
        totalQuestions={totalQuestions}
        headerElement={
          <div className="flex items-center gap-4">
            <h3 className="whitespace-nowrap text-sm font-semibold">
              Difficulty :
            </h3>
            <AutoDecideButton
              onClick={handleAutoDecide}
              disabled={!isAutoDecideValid}
              className="h-7 px-3 text-xs"
            />
          </div>
        }
      />

      {/* <Separator /> */}

      {/* 7] Question Types Selector */}
      <QuestionTypeSelector
        questionCounts={questionCounts}
        onCountChange={onQuestionCountChange}
      />

      {/* <Separator /> */}

      {/* 8] Prompt Box and Generate Button */}
      <PromptBox
        value={customPrompt}
        onChange={setCustomPrompt}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        disabled={false} // Can add logic here if needed, e.g. check if total questions > 0 from counts
      />
    </div>
  );
}
