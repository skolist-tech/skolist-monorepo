import { QuestionTypeSelector } from "./QuestionTypeSelector/QuestionTypeSelector";
import type { AutoDecideParams } from "./AutoDecideQuestion/AutoDecideQuestion";
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
  hardnessLevels: Record<HardnessLevel, number>;
  onHardnessLevelChange: (level: HardnessLevel, value: number) => void;
  totalQuestions: number;
  onTotalQuestionsChange: (value: number) => void;
  // Lifted state for persistence
  totalMarks: number;
  onTotalMarksChange: (value: number) => void;
  totalTime: number;
  onTotalTimeChange: (value: number) => void;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
}

export function UpRightArea({
  questionCounts,
  onQuestionCountChange,
  onAutoDecide,
  onGenerate,
  isGenerating,
  hardnessLevels,
  onHardnessLevelChange,
  totalQuestions,
  onTotalQuestionsChange,
  totalMarks,
  onTotalMarksChange,
  totalTime,
  onTotalTimeChange,
  customPrompt,
  onCustomPromptChange,
}: UpRightAreaProps) {
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
    <div className="h-full w-full max-w-5xl space-y-4 overflow-y-auto p-1 md:space-y-6">
      {/* 1] Top three selectors, arranged horizontally */}
      <TotalInputs
        totalQuestions={totalQuestions}
        totalMarks={totalMarks}
        totalTime={totalTime}
        onTotalQuestionsChange={onTotalQuestionsChange}
        onTotalMarksChange={onTotalMarksChange}
        onTotalTimeChange={onTotalTimeChange}
      />

      {/* <Separator /> */}

      {/* 2, 3, 4, 5, 6] Difficulty Section (Header, Auto Button, Slider, %, Counts) */}
      <div className="pt-4">
        <HardnessLevelSliders
          levels={hardnessLevels}
          onLevelChange={onHardnessLevelChange}
          totalQuestions={totalQuestions}
          headerElement={
            <div className="flex items-center gap-4">
              <div className="mr-2 flex flex-col text-sm font-semibold leading-tight">
                <span>Paper</span>
                <span>Difficulty</span>
              </div>
              <AutoDecideButton
                onClick={handleAutoDecide}
                disabled={!isAutoDecideValid}
                className="h-7 px-3 text-xs"
              />
            </div>
          }
        />
      </div>

      {/* <Separator /> */}
      <div className="pt-3">
        {/* 7] Question Types Selector */}
        <QuestionTypeSelector
          questionCounts={questionCounts}
          onCountChange={onQuestionCountChange}
        />
      </div>

      {/* <Separator /> */}

      {/* 8] Prompt Box and Generate Button */}
      <PromptBox
        value={customPrompt}
        onChange={onCustomPromptChange}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        disabled={false} // Can add logic here if needed, e.g. check if total questions > 0 from counts
      />
    </div>
  );
}
