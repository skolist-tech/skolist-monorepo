/**
 * Up Area - Contains class, subject selectors and concept tree
 * Uses ConceptContext for state management
 */

import { useState } from "react";
import { UpLeftArea } from "./up-left/UpLeftArea";
import { UpRightArea } from "./up-right/UpRightArea";
import type { QuestionType, HardnessLevel } from "@skolist/db";
import type { AutoDecideParams } from "./up-right/AutoDecideQuestion/AutoDecideQuestion";
import { useActivityContext } from "../../../context/ActivityContext";
import { useConceptContext } from "../../../context/ConceptContext";
import { fastApiService } from "../../../services/fastApiService";
import { upsertActivityConcepts } from "../../../services/activityService";
import { useToast } from "@skolist/ui";

// Mapping from frontend QuestionType to API question type
const QUESTION_TYPE_API_MAP: Record<QuestionType, string> = {
  mcq4: "mcq4",
  msq4: "msq4",
  short_answer: "short_answer",
  long_answer: "long_answer",
  true_or_false: "true_false",
  fill_in_the_blanks: "fill_in_the_blank",
};

interface UpAreaProps {
  hardnessLevels: Record<HardnessLevel, number>;
  onHardnessLevelChange: (level: HardnessLevel, value: number) => void;
  onGenerationComplete?: () => void;
}

export function UpArea({
  hardnessLevels,
  onHardnessLevelChange,
  onGenerationComplete,
}: UpAreaProps) {
  const { currentActivity, activities, renameActivity } = useActivityContext();
  const { getSelectedLeafConceptIds, selection, schoolClasses, subjects } =
    useConceptContext();
  const { toast } = useToast();

  const [questionCounts, setQuestionCounts] = useState<
    Record<QuestionType, number>
  >({
    mcq4: 2,
    msq4: 2,
    short_answer: 2,
    long_answer: 2,
    true_or_false: 2,
    fill_in_the_blanks: 2,
  });

  const [totalQuestions, setTotalQuestions] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQuestionCountChange = (type: QuestionType, count: number) => {
    setQuestionCounts((prev) => {
      const newCounts = { ...prev, [type]: count };
      const newTotal = Object.values(newCounts).reduce((a, b) => a + b, 0);
      setTotalQuestions(newTotal);
      return newCounts;
    });
  };

  const handleTotalQuestionsChange = (newTotal: number) => {
    const diff = newTotal - totalQuestions;
    setTotalQuestions(newTotal);

    setQuestionCounts((prev) => {
      // If increasing, just add to MCQ (first priority)
      if (diff > 0) {
        return {
          ...prev,
          mcq4: prev.mcq4 + diff,
        };
      }

      // If decreasing, cascade through types
      let remainingDiff = Math.abs(diff);
      const newCounts = { ...prev };

      const priorityOrder: QuestionType[] = [
        "mcq4",
        "msq4",
        "short_answer",
        "long_answer",
        "true_or_false",
        "fill_in_the_blanks",
      ];

      for (const type of priorityOrder) {
        if (remainingDiff === 0) break;

        const currentCount = newCounts[type];
        const deduct = Math.min(currentCount, remainingDiff);

        newCounts[type] = currentCount - deduct;
        remainingDiff -= deduct;
      }

      return newCounts;
    });
  };

  const handleAutoDecide = (params: AutoDecideParams) => {
    console.log("Auto decide params:", params);
    // TODO: Implement actual auto-decide logic or API call
  };

  const handleGenerateQuestions = async () => {
    // Validation
    if (!currentActivity) {
      toast({
        title: "No Activity Selected",
        description: "Please select or create an activity first.",
        variant: "destructive",
      });
      return;
    }

    const conceptIds = getSelectedLeafConceptIds();
    if (conceptIds.length === 0) {
      toast({
        title: "No Concepts Selected",
        description: "Please select at least one concept from the tree.",
        variant: "destructive",
      });
      return;
    }

    // Build question_types array with only non-zero counts
    const questionTypes = Object.entries(questionCounts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type: QUESTION_TYPE_API_MAP[type as QuestionType],
        count,
      }));

    if (questionTypes.length === 0) {
      toast({
        title: "No Questions Configured",
        description: "Please set a count for at least one question type.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Save selected concepts to the current activity context
      // This ensures that even if generation fails, the association is recorded
      await upsertActivityConcepts(currentActivity.id, conceptIds);

      // Rename activity if it has a default name
      if (
        currentActivity.name === "New Activity" ||
        /^New Activity \(\d+\)$/.test(currentActivity.name)
      ) {
        const className =
          schoolClasses.find((c) => c.id === selection.classId)?.name ||
          "Class";
        const subjectName =
          subjects.find((s) => s.id === selection.subjectId)?.name || "Subject";
        const baseName = `${className} - ${subjectName}`;

        let newName = baseName;
        let counter = 2;

        const baseExists = activities.some(
          (a) => a.name === newName && a.id !== currentActivity.id
        );

        if (baseExists) {
          while (
            activities.some(
              (a) =>
                a.name === `${baseName} (${counter})` &&
                a.id !== currentActivity.id
            )
          ) {
            counter++;
          }
          newName = `${baseName} (${counter})`;
        }

        try {
          await renameActivity(currentActivity.id, newName);
        } catch (error) {
          console.error("Failed to auto-rename activity:", error);
          // Don't block generation if rename fails
        }
      }

      await fastApiService.generateQuestions({
        activity_id: currentActivity.id,
        concept_ids: conceptIds,
        config: {
          question_types: questionTypes,
          difficulty_distribution: hardnessLevels,
        },
      });

      toast({
        title: "Questions Generated",
        description: `Successfully generated questions for ${conceptIds.length} concept(s).`,
      });

      onGenerationComplete?.();
    } catch (error) {
      console.error("Failed to generate questions:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while generating questions.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col p-6">
      <div className="grid grid-cols-1 gap-6 overflow-hidden rounded-xl border bg-card p-6 shadow-sm lg:grid-cols-2">
        {/* Left Column: Selectors */}
        <div className="h-full overflow-hidden lg:border-r lg:pr-6">
          <UpLeftArea />
        </div>

        {/* Right Column: Auto-Decide & Question Types */}
        <div className="h-full overflow-hidden">
          <UpRightArea
            questionCounts={questionCounts}
            onQuestionCountChange={handleQuestionCountChange}
            onAutoDecide={handleAutoDecide}
            onGenerate={handleGenerateQuestions}
            isGenerating={isGenerating}
            hardnessLevels={hardnessLevels}
            onHardnessLevelChange={onHardnessLevelChange}
            totalQuestions={totalQuestions}
            onTotalQuestionsChange={handleTotalQuestionsChange}
          />
        </div>
      </div>
    </div>
  );
}
