import type { Meta, StoryObj } from "@storybook/react";
import { UpRightArea } from "./UpRightArea";
import { fn } from "@storybook/test";
import type { QuestionType, HardnessLevel } from "@skolist/db";

const meta: Meta<typeof UpRightArea> = {
  title: "Generation Pane/Up Area/UpRightArea",
  component: UpRightArea,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof UpRightArea>;

// Mock data
const defaultQuestionCounts: Record<QuestionType, number> = {
  mcq4: 2,
  msq4: 2,
  short_answer: 2,
  long_answer: 2,
  true_or_false: 2,
  fill_in_the_blanks: 2,
};

const defaultHardnessLevels: Record<HardnessLevel, number> = {
  easy: 30,
  medium: 50,
  hard: 20,
};

const defaultProps = {
  questionCounts: defaultQuestionCounts,
  onQuestionCountChange: fn(),
  onAutoDecide: fn(),
  onGenerate: fn(),
  isGenerating: false,
  hardnessLevels: defaultHardnessLevels,
  onHardnessLevelChange: fn(),
  totalQuestions: 12,
  onTotalQuestionsChange: fn(),
  totalMarks: 30,
  onTotalMarksChange: fn(),
  totalTime: 60,
  onTotalTimeChange: fn(),
  customPrompt: "",
  onCustomPromptChange: fn(),
};

export const Default: Story = {
  args: {
    ...defaultProps,
  },
};

export const Generating: Story = {
  args: {
    ...defaultProps,
    isGenerating: true,
  },
};

export const WithCustomValues: Story = {
  args: {
    ...defaultProps,
    totalQuestions: 20,
    totalMarks: 50,
    totalTime: 90,
    questionCounts: {
      mcq4: 10,
      msq4: 0,
      short_answer: 5,
      long_answer: 1,
      true_or_false: 2,
      fill_in_the_blanks: 2,
    },
    hardnessLevels: {
      easy: 10,
      medium: 10,
      hard: 80,
    },
    customPrompt: "Focus on calculus problems.",
  },
};

export const WithValidationState: Story = {
  args: {
    ...defaultProps,
    // Setting invalid total counts to see if component handles it visually?
    // Component doesn't seem to have validation UI built-in (based on reading),
    // but we can check if it looks okay with zeros.
    totalQuestions: 0,
    totalMarks: 0,
    questionCounts: {
      mcq4: 0,
      msq4: 0,
      short_answer: 0,
      long_answer: 0,
      true_or_false: 0,
      fill_in_the_blanks: 0,
    },
  },
};
