/**
 * Up Area - Contains class, subject selectors and concept tree
 * Uses ConceptContext for state management
 */

import { useState, useEffect } from "react";
import { UpLeftArea } from "./up-left/UpLeftArea";
import { UpRightArea } from "./up-right/UpRightArea";
import type { QuestionType, HardnessLevel } from "@skolist/db";
import type { AutoDecideParams } from "./up-right/AutoDecideQuestion/AutoDecideQuestion";
import { useActivityContext } from "../../../context/ActivityContext";
import { useConceptContext } from "../../../context/ConceptContext";
import { useQuestionsContext } from "../../../context/QuestionsContext";
import { fastApiService } from "../../../services/fastApiService";
import { upsertActivityConcepts } from "../../../services/activityService";
import {
  fetchGenerationPaneStatus,
  upsertGenerationPaneStatus,
  fetchGenerationPaneConcepts,
  replaceGenerationPaneConcepts,
} from "../../../services/generationPaneService";
import { useToast } from "@skolist/ui";

// Mapping from frontend QuestionType to API question type
const QUESTION_TYPE_API_MAP: Record<QuestionType, string> = {
  mcq4: "mcq4",
  msq4: "msq4",
  short_answer: "short_answer",
  long_answer: "long_answer",
  true_or_false: "true_false",
  fill_in_the_blanks: "fill_in_the_blank",
  match_the_following: "match_the_following",
};

// Default values for generation pane
const DEFAULT_QUESTION_COUNTS: Record<QuestionType, number> = {
  mcq4: 2,
  msq4: 2,
  short_answer: 2,
  long_answer: 2,
  true_or_false: 2,
  fill_in_the_blanks: 2,
  match_the_following: 2,
};

interface UpAreaProps {
  hardnessLevels: Record<HardnessLevel, number>;
  onHardnessLevelChange: (level: HardnessLevel, value: number) => void;
  isGenerating?: boolean;
  onGenerateStart?: () => void;
  onGenerateEnd?: () => void;
}

export function UpArea({
  hardnessLevels,
  onHardnessLevelChange,
  isGenerating = false,
  onGenerateStart,
  onGenerateEnd,
}: UpAreaProps) {
  const { currentActivity, activities, renameActivity } = useActivityContext();
  const {
    getSelectedLeafConceptIds,
    selection,
    schoolClasses,
    subjects,
    selectSchoolClass,
    selectSubject,
    setSelectedConcepts,
  } = useConceptContext();
  const { markAllQuestionsOld } = useQuestionsContext();
  const { toast } = useToast();

  const [questionCounts, setQuestionCounts] = useState<
    Record<QuestionType, number>
  >(DEFAULT_QUESTION_COUNTS);

  const [totalQuestions, setTotalQuestions] = useState(12);
  const [internalIsGenerating, setInternalIsGenerating] = useState(false);

  // Use prop if available, otherwise local state
  const isBusy = isGenerating || internalIsGenerating;

  // Lifted state from UpRightArea for persistence
  const [totalMarks, setTotalMarks] = useState(30);
  const [totalTime, setTotalTime] = useState(60);
  const [customPrompt, setCustomPrompt] = useState("");

  // State for staged restoration of dependent data (Class -> Subject -> Tree)
  const [pendingRestoration, setPendingRestoration] = useState<{
    subjectId: string | null;
    conceptIds: string[];
    isSubjectRestored: boolean; // Flag to prevent enforcing subject restoration repeatedly
  } | null>(null);

  // Effect 1: Load saved status and restore independent state + Class
  useEffect(() => {
    if (!currentActivity?.id) return;

    const loadSavedStatus = async () => {
      try {
        const savedStatus = await fetchGenerationPaneStatus(currentActivity.id);
        if (savedStatus) {
          // Restore question counts
          setQuestionCounts({
            mcq4: savedStatus.mcq_count ?? DEFAULT_QUESTION_COUNTS.mcq4,
            msq4: savedStatus.msq_count ?? DEFAULT_QUESTION_COUNTS.msq4,
            short_answer:
              savedStatus.short_answer_count ??
              DEFAULT_QUESTION_COUNTS.short_answer,
            long_answer:
              savedStatus.long_answer_count ??
              DEFAULT_QUESTION_COUNTS.long_answer,
            true_or_false:
              savedStatus.true_false_count ??
              DEFAULT_QUESTION_COUNTS.true_or_false,
            fill_in_the_blanks:
              savedStatus.fill_in_the_blanks_count ??
              DEFAULT_QUESTION_COUNTS.fill_in_the_blanks,
            match_the_following:
              (savedStatus as any).match_the_following_count ??
              DEFAULT_QUESTION_COUNTS.match_the_following,
          });
          setTotalQuestions(savedStatus.total_questions_count ?? 12);
          setTotalMarks(savedStatus.total_marks_count ?? 30);
          setTotalTime(savedStatus.total_time_count ?? 60);
          setCustomPrompt(savedStatus.custom_instructions ?? "");

          // Restore difficulty levels via the parent callback
          if (savedStatus.difficulty_level_easy_count != null) {
            onHardnessLevelChange(
              "easy",
              savedStatus.difficulty_level_easy_count
            );
          }
          if (savedStatus.difficulty_level_medium_count != null) {
            onHardnessLevelChange(
              "medium",
              savedStatus.difficulty_level_medium_count
            );
          }
          if (savedStatus.difficulty_level_hard_count != null) {
            onHardnessLevelChange(
              "hard",
              savedStatus.difficulty_level_hard_count
            );
          }

          // Restore class immediately
          if (savedStatus.school_class_id) {
            selectSchoolClass(savedStatus.school_class_id);
          }

          // Prepare for staged restoration of Subject and Concepts
          let conceptIds: string[] = [];
          try {
            conceptIds = await fetchGenerationPaneConcepts(savedStatus.id);
          } catch (e) {
            console.error("Failed to load saved concepts:", e);
          }

          setPendingRestoration({
            subjectId: savedStatus.subject_id,
            conceptIds: conceptIds,
            isSubjectRestored: false,
          });
        }
      } catch (error) {
        console.error("Failed to load saved generation pane status:", error);
      }
    };

    loadSavedStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentActivity?.id]);

  // Effect 2: Restore Subject once Classes/Subjects are ready
  const { isLoadingSubjects, isLoadingTree } = useConceptContext();

  useEffect(() => {
    if (
      pendingRestoration?.subjectId &&
      !pendingRestoration.isSubjectRestored && // Only run if not already restored
      !isLoadingSubjects &&
      selection.subjectId !== pendingRestoration.subjectId
    ) {
      // Check if the subject actually exists in the loaded list
      const subjectExists = subjects.some(
        (s) => s.id === pendingRestoration.subjectId
      );
      if (subjectExists) {
        selectSubject(pendingRestoration.subjectId);
        // Mark as restored so we don't force it again if user changes it later
        setPendingRestoration((prev) =>
          prev ? { ...prev, isSubjectRestored: true } : null
        );
      } else {
        // Subject doesn't exist in the list (maybe deleted?), assume restored/failed to stop loop
        setPendingRestoration((prev) =>
          prev ? { ...prev, isSubjectRestored: true } : null
        );
      }
    } else if (
      pendingRestoration?.subjectId &&
      !pendingRestoration.isSubjectRestored &&
      !isLoadingSubjects &&
      selection.subjectId === pendingRestoration.subjectId
    ) {
      // If it's already selected (maybe auto-selected or matching), mark as restored
      setPendingRestoration((prev) =>
        prev ? { ...prev, isSubjectRestored: true } : null
      );
    }
  }, [
    pendingRestoration,
    isLoadingSubjects,
    subjects,
    selection.subjectId,
    selectSubject,
  ]);

  // Effect 3: Restore Concepts once Subject is selected and Tree is ready
  useEffect(() => {
    if (
      pendingRestoration &&
      pendingRestoration.conceptIds.length > 0 &&
      selection.subjectId === pendingRestoration.subjectId &&
      !isLoadingTree
    ) {
      // Only attempt restore if we actually have a valid tree loaded or if we determine the tree is ready
      // We check !isLoadingTree, but to be safe against the initial "false" state before fetch starts,
      // we could check if we have concepts, but empty subjects are possible.
      // Given ConceptContext logic, if subjectId matches, it triggers fetch.
      // We rely on isLoadingTree being accurate during the fetch phase.

      // Delay slightly to ensure tree checkbox state is ready?
      // Actually with controlled component pattern in ConceptContext (checked array),
      // we can set it anytime.

      setSelectedConcepts(pendingRestoration.conceptIds);

      // Clear pending restoration to prevent re-running
      setPendingRestoration((prev) => {
        if (prev?.subjectId === selection.subjectId) {
          return null;
        }
        return prev;
      });
    }
  }, [
    pendingRestoration,
    selection.subjectId,
    isLoadingTree,
    setSelectedConcepts,
  ]);

  const handleQuestionCountChange = (type: QuestionType, count: number) => {
    setQuestionCounts((prev) => {
      const newCounts = { ...prev, [type]: count };
      const newTotal = Object.entries(newCounts).reduce(
        (sum, [, val]) => sum + val,
        0
      );
      setTotalQuestions(newTotal);

      // Simple mark/time estimation based on counts (if they are still at default/sync levels)
      // This helps with the "relevant constraints" objective
      const estimatedMarks =
        newCounts.mcq4 * 1 +
        newCounts.msq4 * 1 +
        newCounts.true_or_false * 1 +
        newCounts.fill_in_the_blanks * 1 +
        newCounts.short_answer * 3 +
        newCounts.long_answer * 5 +
        newCounts.match_the_following * 4;

      const estimatedTime =
        newCounts.mcq4 * 1 +
        newCounts.msq4 * 2 +
        newCounts.true_or_false * 1 +
        newCounts.fill_in_the_blanks * 1 +
        newCounts.short_answer * 5 +
        newCounts.long_answer * 15 +
        newCounts.match_the_following * 5;

      // Only auto-update if they are close to old defaults or at low values
      if (totalMarks <= 30) setTotalMarks(estimatedMarks);
      if (totalTime <= 60) setTotalTime(estimatedTime);

      return newCounts;
    });
  };

  const handleTotalQuestionsChange = (newTotal: number) => {
    const diff = newTotal - totalQuestions;
    setTotalQuestions(newTotal);

    setQuestionCounts((prev) => {
      const newCounts = { ...prev };

      const priorityOrder: QuestionType[] = [
        "mcq4",
        "msq4",
        "short_answer",
        "long_answer",
        "true_or_false",
        "fill_in_the_blanks",
        "match_the_following",
      ];

      if (diff > 0) {
        // Distribute increase among active types first, then MCQ
        let remainingDiff = diff;
        const activeTypes = priorityOrder.filter((t) => prev[t] > 0);
        const typesToIncrement =
          activeTypes.length > 0 ? activeTypes : ["mcq4" as QuestionType];

        while (remainingDiff > 0) {
          for (const type of typesToIncrement) {
            if (remainingDiff === 0) break;
            newCounts[type] = (newCounts[type] || 0) + 1;
            remainingDiff--;
          }
        }
      } else if (diff < 0) {
        // Cascade decrease
        let remainingDiff = Math.abs(diff);
        for (const type of priorityOrder) {
          if (remainingDiff === 0) break;
          const currentCount = newCounts[type];
          const deduct = Math.min(currentCount, remainingDiff);
          newCounts[type] = currentCount - deduct;
          remainingDiff -= deduct;
        }
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

    if (totalQuestions < 1 || totalQuestions > 50) {
      toast({
        title: "Invalid Total Questions",
        description: "Total Questions must be between 1 and 50.",
        variant: "destructive",
      });
      return;
    }

    if (totalMarks < 1 || totalMarks > 500) {
      toast({
        title: "Invalid Total Marks",
        description: "Total Marks must be between 1 and 500.",
        variant: "destructive",
      });
      return;
    }

    if (totalTime < 1 || totalTime > 240) {
      toast({
        title: "Invalid Duration",
        description: "Total Time must be between 1 and 240 minutes.",
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

    // If parent manages state, notify start, else set local
    if (onGenerateStart) {
      onGenerateStart();
    } else {
      setInternalIsGenerating(true);
    }

    try {
      // Save selected concepts to the current activity context
      // This ensures that even if generation fails, the association is recorded
      await upsertActivityConcepts(currentActivity.id, conceptIds);

      // Rename activity if it has a default name
      if (
        currentActivity.name === "New Activity" ||
        /^New Activity \d+$/.test(currentActivity.name)
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
        // forward the custom prompt to backend as `instructions`
        instructions: customPrompt || undefined,
      });

      toast({
        title: "Questions Generated",
        description: `Successfully generated questions for ${conceptIds.length} concept(s).`,
      });

      // Persist generation pane status after successful generation
      try {
        const savedPane = await upsertGenerationPaneStatus({
          activity_id: currentActivity.id,
          school_class_id: selection.classId,
          subject_id: selection.subjectId,
          mcq_count: questionCounts.mcq4,
          msq_count: questionCounts.msq4,
          short_answer_count: questionCounts.short_answer,
          long_answer_count: questionCounts.long_answer,
          true_false_count: questionCounts.true_or_false,
          fill_in_the_blanks_count: questionCounts.fill_in_the_blanks,
          match_the_following_count: questionCounts.match_the_following,
          difficulty_level_easy_count: hardnessLevels.easy,
          difficulty_level_medium_count: hardnessLevels.medium,
          difficulty_level_hard_count: hardnessLevels.hard,
          total_questions_count: totalQuestions,
          total_marks_count: totalMarks,
          total_time_count: totalTime,
          custom_instructions: customPrompt || null,
        });

        // Persist selected concepts for this pane
        await replaceGenerationPaneConcepts(savedPane.id, conceptIds);
      } catch (persistError) {
        console.error(
          "Failed to persist generation pane status or concepts:",
          persistError
        );
        // Don't block UI for this error
      }
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
      // Mark all questions as old when generation ends
      markAllQuestionsOld();

      if (onGenerateEnd) {
        onGenerateEnd();
      } else {
        setInternalIsGenerating(false);
      }
    }
  };

  return (
    <div className="flex flex-col p-4 md:p-6">
      <div className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 shadow-sm md:gap-6 md:p-6 lg:grid-cols-2">
        {/* Left Column: Selectors */}
        <div className="relative z-20 h-full border-b pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          <UpLeftArea />
        </div>

        {/* Right Column: Auto-Decide & Question Types */}
        <div className="relative z-10 h-full pt-2 lg:pt-0">
          <UpRightArea
            questionCounts={questionCounts}
            onQuestionCountChange={handleQuestionCountChange}
            onAutoDecide={handleAutoDecide}
            onGenerate={handleGenerateQuestions}
            isGenerating={isBusy}
            hardnessLevels={hardnessLevels}
            onHardnessLevelChange={onHardnessLevelChange}
            totalQuestions={totalQuestions}
            onTotalQuestionsChange={handleTotalQuestionsChange}
            totalMarks={totalMarks}
            onTotalMarksChange={setTotalMarks}
            totalTime={totalTime}
            onTotalTimeChange={setTotalTime}
            customPrompt={customPrompt}
            onCustomPromptChange={setCustomPrompt}
          />
        </div>
      </div>
    </div>
  );
}
