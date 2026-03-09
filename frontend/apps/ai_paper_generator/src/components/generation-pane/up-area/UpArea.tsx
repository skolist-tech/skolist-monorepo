/**
 * Up Area - Contains class, subject selectors and concept tree
 * Uses ConceptContext for state management
 */

import { useState, useEffect, useMemo } from "react";
import { UpLeftArea } from "./up-left/UpLeftArea";
import { UpRightArea } from "./up-right/UpRightArea";
import type { HardnessLevel } from "@skolist/db";

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
const QUESTION_TYPE_API_MAP: Record<ExtendedQuestionType, string> = {
  mcq4: "mcq4",
  msq4: "msq4",
  short_answer: "short_answer",
  long_answer: "long_answer",
  true_or_false: "true_false",
  fill_in_the_blanks: "fill_in_the_blank",
  match_the_following: "match_the_following",
  numerical_answer: "numerical_answer",
  integer_answer: "integer_answer",
  solved_examples: "solved_examples",
  exercise_questions: "exercise_questions",
};

import {
  SUBJECT_QUESTION_CONFIG,
  type DifficultyDistribution,
} from "../../../config/question_types_config";
import type { ExtendedQuestionType } from "../../../config/question_types_config";
import { useQuestionCounts } from "../../../hooks/useQuestionCounts";
import { useDifficultyLevels } from "../../../hooks/useDifficultyLevels";

interface UpAreaProps {
  onHardnessLevelChange: (level: HardnessLevel, value: number) => void;
  isGenerating?: boolean;
  onGenerateStart?: () => void;
  onGenerateEnd?: () => void;
}

export function UpArea({
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

  // Get subject name for config
  const subjectName = useMemo<string>(() => {
    const subject = subjects.find((s) => s.id === selection.subjectId);
    return subject?.name?.trim().toLowerCase() ?? "";
  }, [subjects, selection.subjectId]);

  // State to hold restored counts from database
  const [restoredCounts, setRestoredCounts] = useState<Partial<
    Record<ExtendedQuestionType, number>
  > | null>(null);

  // State to hold restored difficulty levels from database
  const [restoredDifficultyLevels, setRestoredDifficultyLevels] =
    useState<DifficultyDistribution | null>(null);

  // Custom hook for question counts logic
  const {
    questionCounts,
    setQuestionCounts,
    handleCountChange,
    totalQuestions,
    setTotalQuestions,
  } = useQuestionCounts(subjectName, restoredCounts);

  // Custom hook for difficulty levels logic
  const { difficultyLevels, handleLevelChange: handleDifficultyChange } =
    useDifficultyLevels(subjectName, restoredDifficultyLevels);

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
          // Restore question counts (using defaults as fallback if fields are missing)
          const restored: Partial<Record<ExtendedQuestionType, number>> = {};

          // Apply saved values if exist
          if (savedStatus.mcq_count !== null)
            restored.mcq4 = savedStatus.mcq_count;
          if (savedStatus.msq_count !== null)
            restored.msq4 = savedStatus.msq_count;
          if (savedStatus.short_answer_count !== null)
            restored.short_answer = savedStatus.short_answer_count;
          if (savedStatus.long_answer_count !== null)
            restored.long_answer = savedStatus.long_answer_count;
          if (savedStatus.true_false_count !== null)
            restored.true_or_false = savedStatus.true_false_count;
          if (savedStatus.fill_in_the_blanks_count !== null)
            restored.fill_in_the_blanks = savedStatus.fill_in_the_blanks_count;
          if (savedStatus.match_the_following_count !== null)
            restored.match_the_following =
              savedStatus.match_the_following_count;
          if (savedStatus.solved_examples_count !== null)
            restored.solved_examples = savedStatus.solved_examples_count;
          if (savedStatus.exercise_questions_count !== null)
            restored.exercise_questions = savedStatus.exercise_questions_count;
          if (savedStatus.numerical_answer_count !== null)
            restored.numerical_answer = savedStatus.numerical_answer_count;
          if (savedStatus.integer_answer_count !== null)
            restored.integer_answer = savedStatus.integer_answer_count;

          setRestoredCounts(restored);

          // Note: Total questions is derived from counts by the hook, so we don't set it manually here.
          // However, we set other independent fields.
          setTotalMarks(savedStatus.total_marks_count ?? 30);
          setTotalTime(savedStatus.total_time_count ?? 60);
          setCustomPrompt(savedStatus.custom_instructions ?? "");

          // Restore difficulty levels
          const restoredDiff: Partial<DifficultyDistribution> = {};
          if (savedStatus.difficulty_level_easy_count != null)
            restoredDiff.easy = savedStatus.difficulty_level_easy_count;
          if (savedStatus.difficulty_level_medium_count != null)
            restoredDiff.medium = savedStatus.difficulty_level_medium_count;
          if (savedStatus.difficulty_level_hard_count != null)
            restoredDiff.hard = savedStatus.difficulty_level_hard_count;

          setRestoredDifficultyLevels(
            restoredDiff as DifficultyDistribution | null
          );

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

  // Sync internal difficulty levels with parent
  useEffect(() => {
    onHardnessLevelChange("easy", difficultyLevels.easy);
    onHardnessLevelChange("medium", difficultyLevels.medium);
    onHardnessLevelChange("hard", difficultyLevels.hard);
  }, [difficultyLevels, onHardnessLevelChange]);

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

    // Determine allowed types for current subject
    // Logic: If config exists, only keys present are allowed?
    // OR: All types allowed, but filtered from UI if count is 0 and not in explicit list?
    // Let's stick to: All non-hidden types.
    // For generation, we just use counts > 0.
    // But we need to support the case where user sets count > 0 manually.

    // Simplification: Send any type with count > 0.
    const questionTypes = Object.entries(questionCounts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        type: QUESTION_TYPE_API_MAP[type as ExtendedQuestionType],
        count,
      }));

    if (questionTypes.length === 0) {
      toast({
        title: "No Questions Configured",
        description: "Please set a count for at least one valid question type.",
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
      // Mark all existing questions as old before generating new ones
      await markAllQuestionsOld();

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
          difficulty_distribution: difficultyLevels,
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
          numerical_answer_count: questionCounts.numerical_answer,
          integer_answer_count: questionCounts.integer_answer,
          difficulty_level_easy_count: difficultyLevels.easy,
          difficulty_level_medium_count: difficultyLevels.medium,
          difficulty_level_hard_count: difficultyLevels.hard,
          total_marks_count: totalMarks,
          total_time_count: totalTime,
          custom_instructions: customPrompt || null,
          solved_examples_count: questionCounts.solved_examples,
          exercise_questions_count: questionCounts.exercise_questions,
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
      if (onGenerateEnd) {
        onGenerateEnd();
      } else {
        setInternalIsGenerating(false);
      }
    }
  };

  const handleTotalQuestionsChange = (newTotal: number) => {
    const diff = newTotal - totalQuestions;
    setTotalQuestions(newTotal);

    setQuestionCounts((prev) => {
      const newCounts = { ...prev };

      // Determine allowed types from Config or Defaults
      // If Subject Config exists, prioritize keys that are set there?
      // Or just prioritize Global Order
      const globalOrder: ExtendedQuestionType[] = [
        "mcq4",
        "msq4",
        "short_answer",
        "long_answer",
        "true_or_false",
        "fill_in_the_blanks",
        "match_the_following",
        "numerical_answer",
        "integer_answer",
        "solved_examples",
        "exercise_questions",
      ];

      const subjectConfig = SUBJECT_QUESTION_CONFIG[subjectName];
      const allowedTypes = subjectConfig
        ? (Object.keys(subjectConfig) as ExtendedQuestionType[])
        : globalOrder;

      // Filter priority order to only include types relevant for this subject
      const filteredPriorityOrder: ExtendedQuestionType[] = globalOrder.filter(
        (t) => allowedTypes.includes(t)
      );

      if (diff > 0) {
        // Distribute increase among active types first, then defaults if available
        let remainingDiff = diff;
        // Prioritize types that already have counts > 0
        const activeTypes = filteredPriorityOrder.filter((t) => prev[t] > 0);

        // If no active types, try to use the first allowed type (e.g. MCQ)
        const firstType = filteredPriorityOrder[0];
        const typesToIncrement: ExtendedQuestionType[] =
          activeTypes.length > 0 ? activeTypes : firstType ? [firstType] : [];

        if (typesToIncrement.length > 0) {
          while (remainingDiff > 0) {
            for (const type of typesToIncrement) {
              if (remainingDiff === 0) break;
              newCounts[type] = (newCounts[type] || 0) + 1;
              remainingDiff--;
            }
          }
        }
      } else if (diff < 0) {
        // Cascade decrease
        let remainingDiff = Math.abs(diff);
        for (const type of filteredPriorityOrder) {
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
            onQuestionCountChange={handleCountChange}
            onGenerate={handleGenerateQuestions}
            isGenerating={isBusy}
            hardnessLevels={difficultyLevels}
            onHardnessLevelChange={handleDifficultyChange}
            totalQuestions={totalQuestions}
            onTotalQuestionsChange={handleTotalQuestionsChange}
            totalMarks={totalMarks}
            onTotalMarksChange={setTotalMarks}
            totalTime={totalTime}
            onTotalTimeChange={setTotalTime}
            customPrompt={customPrompt}
            onCustomPromptChange={setCustomPrompt}
            subjectName={subjectName}
          />
        </div>
      </div>
    </div>
  );
}
