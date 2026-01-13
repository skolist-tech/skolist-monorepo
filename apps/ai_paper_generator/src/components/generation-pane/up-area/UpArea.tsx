/**
 * Up Area - Contains class, subject selectors and concept tree
 * Uses ConceptContext for state management
 */

import { useState } from "react";
import { UpLeftArea } from "./up-left";
import { UpRightArea } from "./up-right";
import type { QuestionType } from "@skolist/db";
import type { AutoDecideParams } from "./up-right/AutoDecideQuestion";
import { useActivityContext } from "../../../context/ActivityContext";
import { useConceptContext } from "../../../context/ConceptContext";
import { fastApiService } from "../../../services/fastApiService";
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

export function UpArea() {
  const { currentActivity } = useActivityContext();
  const { getSelectedLeafConceptIds } = useConceptContext();
  const { toast } = useToast();

  const [questionCounts, setQuestionCounts] = useState<
    Record<QuestionType, number>
  >({
    mcq4: 1,
    msq4: 1,
    short_answer: 1,
    long_answer: 1,
    true_or_false: 1,
    fill_in_the_blanks: 1,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleQuestionCountChange = (type: QuestionType, count: number) => {
    setQuestionCounts((prev) => ({
      ...prev,
      [type]: count,
    }));
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
      await fastApiService.generateQuestions({
        activity_id: currentActivity.id,
        concept_ids: conceptIds,
        config: {
          question_types: questionTypes,
          difficulty_distribution: {
            easy: 30,
            medium: 50,
            hard: 20,
          },
        },
      });

      toast({
        title: "Questions Generated",
        description: `Successfully generated questions for ${conceptIds.length} concept(s).`,
      });
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
          />
        </div>
      </div>
    </div>
  );
}
