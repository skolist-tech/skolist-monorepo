import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { GeneratedQuestionCard } from "./GeneratedQuestionCard";
import type { GeneratedQuestionWithConcepts } from "../../../services/questionService";

// Mock auto-correct handler that waits 5 seconds (to showcase the animation)
const mockAutoCorrect = async (_questionId: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 5000));
};

// Mock direct regenerate handler that waits 5 seconds (to showcase the animation)
const mockDirectRegenerate = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 5000));
};

// Mock regenerate with prompt handler that waits 5 seconds (to showcase the typing animation)
const mockRegenerateWithPrompt = async (_questionId: string, _prompt: string, _files: File[]): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 5000));
};

// Mock delete handler (returns immediately, animation is handled by the component)
const mockDelete = async (_questionId: string): Promise<void> => {
  // The component handles the animation, this just simulates the API call
  console.log("Question deleted:", _questionId);
};

// Mock question data
const createMockQuestion = (
  overrides: Partial<GeneratedQuestionWithConcepts> = {}
): GeneratedQuestionWithConcepts => ({
  id: "550e8400-e29b-41d4-a716-446655440000",
  activity_id: "activity-123",
  question_text:
    "What is the derivative of $f(x) = x^2 + 3x + 2$ with respect to $x$?",
  question_type: "mcq4",
  option1: "$2x + 3$",
  option2: "$x^2 + 3$",
  option3: "$2x + 2$",
  option4: "$x + 3$",
  correct_mcq_option: 1,
  answer_text: "This is the answer",
  msq_option1_answer: false,
  msq_option2_answer: false,
  msq_option3_answer: false,
  msq_option4_answer: false,
  explanation:
    "Using the power rule, the derivative of $x^2$ is $2x$, and the derivative of $3x$ is $3$. The constant $2$ has a derivative of $0$.",
  marks: 4,
  hardness_level: "medium",
  is_in_draft: false,
  is_page_break_below: false,
  qgen_draft_section_id: "null",
  position_in_draft: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  concepts: [
    { id: "concept-1", name: "Differentiation" },
    { id: "concept-2", name: "Power Rule" },
  ],
  images: [],
  ...overrides,
});

const meta = {
  title: "AI Paper Generator/Question/GeneratedQuestionCard",
  component: GeneratedQuestionCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    showReorder: { control: "boolean" },
    isSelected: { control: "boolean" },
  },
  args: {
    onMoveToDraft: fn(),
    onRemoveFromDraft: fn(),
    onUpdate: fn(),
    onDelete: mockDelete,
    onDirectRegenerate: mockDirectRegenerate,
    onRegenerate: fn(),
    onMoveUp: fn(),
    onMoveDown: fn(),
    onSelect: fn(),
    onAutoCorrect: mockAutoCorrect,
    onRegenerateWithPrompt: mockRegenerateWithPrompt,
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GeneratedQuestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// BASIC QUESTION TYPES
// ============================================================================

export const MCQQuestion: Story = {
  args: {
    question: createMockQuestion(),
  },
};

export const MSQQuestion: Story = {
  args: {
    question: createMockQuestion({
      id: "msq-question-id",
      question_type: "msq4",
      question_text:
        "Which of the following are prime numbers? (Select all that apply)",
      option1: "2",
      option2: "4",
      option3: "7",
      option4: "9",
      correct_mcq_option: null,
      explanation: "2 and 7 are prime numbers. 4 = 2×2 and 9 = 3×3 are not.",
    }),
  },
};

export const ShortAnswerQuestion: Story = {
  args: {
    question: createMockQuestion({
      id: "short-answer-id",
      question_type: "short_answer",
      question_text: "What is the capital of France?",
      option1: null,
      option2: null,
      option3: null,
      option4: null,
      correct_mcq_option: null,
      answer_text: "Paris",
      explanation:
        "Paris is the capital and largest city of France, located in the north-central part of the country.",
    }),
  },
};

export const TrueOrFalseQuestion: Story = {
  args: {
    question: createMockQuestion({
      id: "true-false-id",
      question_type: "true_or_false",
      question_text: "The Earth is the third planet from the Sun.",
      option1: null,
      option2: null,
      option3: null,
      option4: null,
      correct_mcq_option: null,
      answer_text: "True",
      explanation:
        "The order of planets from the Sun is: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.",
    }),
  },
};

export const FillInTheBlanksQuestion: Story = {
  args: {
    question: createMockQuestion({
      id: "fill-blanks-id",
      question_type: "fill_in_the_blanks",
      question_text: "Water boils at _____ degrees Celsius at sea level.",
      option1: null,
      option2: null,
      option3: null,
      option4: null,
      correct_mcq_option: null,
      answer_text: "100",
      explanation:
        "At standard atmospheric pressure (sea level), water boils at 100°C or 212°F.",
    }),
  },
};

export const LongAnswerQuestion: Story = {
  args: {
    question: createMockQuestion({
      id: "long-answer-id",
      question_type: "long_answer",
      question_text:
        "Explain the process of photosynthesis and its importance for life on Earth.",
      option1: null,
      option2: null,
      option3: null,
      option4: null,
      correct_mcq_option: null,
      answer_text:
        "Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy, usually from the sun, into chemical energy stored in glucose. The overall equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This process is crucial because it produces oxygen for aerobic organisms and forms the base of most food chains.",
      explanation:
        "This question tests understanding of biological processes and their ecological significance.",
      marks: 10,
      hardness_level: "hard",
    }),
  },
};

// ============================================================================
// DIFFICULTY LEVELS
// ============================================================================

export const EasyQuestion: Story = {
  args: {
    question: createMockQuestion({
      hardness_level: "easy",
      marks: 2,
      question_text: "What is 2 + 2?",
      option1: "3",
      option2: "4",
      option3: "5",
      option4: "6",
      correct_mcq_option: 2,
      explanation: "Basic addition: 2 + 2 = 4",
    }),
  },
};

export const MediumQuestion: Story = {
  args: {
    question: createMockQuestion({
      hardness_level: "medium",
      marks: 4,
    }),
  },
};

export const HardQuestion: Story = {
  args: {
    question: createMockQuestion({
      hardness_level: "hard",
      marks: 6,
      question_text:
        "Evaluate the integral $\\int_0^{\\pi} \\sin^2(x) \\, dx$",
      option1: "$\\frac{\\pi}{2}$",
      option2: "$\\pi$",
      option3: "$2\\pi$",
      option4: "$0$",
      correct_mcq_option: 1,
      explanation:
        "Using the identity $\\sin^2(x) = \\frac{1 - \\cos(2x)}{2}$, we get $\\frac{\\pi}{2}$.",
      concepts: [
        { id: "c1", name: "Integration" },
        { id: "c2", name: "Trigonometric Identities" },
        { id: "c3", name: "Definite Integrals" },
      ],
    }),
  },
};

// ============================================================================
// DRAFT STATES
// ============================================================================

export const InDraft: Story = {
  args: {
    question: createMockQuestion({
      is_in_draft: true,
      position_in_draft: 5,
    }),
    onRemoveFromDraft: fn(),
  },
};

export const NotInDraft: Story = {
  args: {
    question: createMockQuestion({
      is_in_draft: false,
      position_in_draft: null,
    }),
  },
};

// ============================================================================
// SELECTION & REORDER STATES
// ============================================================================

export const Selected: Story = {
  args: {
    question: createMockQuestion(),
    isSelected: true,
    onSelect: fn(),
  },
};

export const WithReorderButtons: Story = {
  args: {
    question: createMockQuestion({
      is_in_draft: true,
      position_in_draft: 3,
    }),
    showReorder: true,
    onMoveUp: fn(),
    onMoveDown: fn(),
  },
};

// ============================================================================
// WITH IMAGES
// ============================================================================

export const WithImages: Story = {
  args: {
    question: createMockQuestion({
      question_text:
        "Identify the geometric shape shown in the image and calculate its area.",
      images: [
        {
          id: "img-1",
          gen_question_id: "550e8400-e29b-41d4-a716-446655440000",
          img_url: "https://placehold.co/400x300/e2e8f0/475569?text=Triangle",
          position: 1,
          created_at: new Date().toISOString(),
          svg_string: null,
          file_path : "/images/question-550e8400-e29b-41d4-a716-446655440000-img-1.png",
        },
      ],
    }),
  },
};

export const WithMultipleImages: Story = {
  args: {
    question: createMockQuestion({
      question_text:
        "Compare the two graphs shown below and describe their differences.",
      images: [
        {
          id: "img-1",
          gen_question_id: "550e8400-e29b-41d4-a716-446655440000",
          img_url: "https://placehold.co/300x200/e2e8f0/475569?text=Graph+A",
          position: 1,
          created_at: new Date().toISOString(),
          svg_string: null,
          file_path : "/images/question-550e8400-e29b-41d4-a716-446655440000-img-1.png",
        },
        {
          id: "img-2",
          gen_question_id: "550e8400-e29b-41d4-a716-446655440000",
          img_url: "https://placehold.co/300x200/e2e8f0/475569?text=Graph+B",
          position: 2,
          created_at: new Date().toISOString(),
          svg_string: null,
          file_path : "/images/question-550e8400-e29b-41d4-a716-446655440000-img-2.png",
        },
      ],
    }),
  },
};

// ============================================================================
// EDGE CASES
// ============================================================================

export const LongQuestionText: Story = {
  args: {
    question: createMockQuestion({
      question_text:
        "A train leaves Station A at 9:00 AM traveling at 60 km/h towards Station B. Another train leaves Station B at 10:00 AM traveling at 80 km/h towards Station A. If the distance between the two stations is 280 km, at what time will the two trains meet? Also, calculate the distance from Station A to the meeting point.",
      explanation:
        "This is a classic relative motion problem. The first train travels for 1 hour before the second train starts, covering 60 km. The remaining distance is 220 km. The relative speed is 60 + 80 = 140 km/h. Time to meet = 220/140 ≈ 1.57 hours after 10:00 AM.",
    }),
  },
};

export const NoExplanation: Story = {
  args: {
    question: createMockQuestion({
      explanation: null,
    }),
  },
};

export const ManyConcepts: Story = {
  args: {
    question: createMockQuestion({
      concepts: [
        { id: "c1", name: "Algebra" },
        { id: "c2", name: "Quadratic Equations" },
        { id: "c3", name: "Factorization" },
        { id: "c4", name: "Roots" },
        { id: "c5", name: "Discriminant" },
        { id: "c6", name: "Polynomial Functions" },
      ],
    }),
  },
};

export const NoConcepts: Story = {
  args: {
    question: createMockQuestion({
      concepts: [],
    }),
  },
};

// ============================================================================
// MINIMAL PROPS (No optional handlers)
// ============================================================================

export const MinimalProps: Story = {
  args: {
    question: createMockQuestion(),
    onMoveToDraft: fn(),
    onUpdate: undefined,
    onDelete: undefined,
    onDirectRegenerate: undefined,
    onRegenerate: undefined,
    onMoveUp: undefined,
    onMoveDown: undefined,
    onSelect: undefined,
    onRemoveFromDraft: undefined,
  },
};

// ============================================================================
// LATEX HEAVY CONTENT
// ============================================================================

export const LatexHeavyQuestion: Story = {
  args: {
    question: createMockQuestion({
      question_text:
        "Solve the quadratic equation $ax^2 + bx + c = 0$ using the quadratic formula. Given $a = 2$, $b = -7$, and $c = 3$, find the values of $x$.",
      option1: "$x = 3$ or $x = \\frac{1}{2}$",
      option2: "$x = 2$ or $x = \\frac{3}{2}$",
      option3: "$x = 1$ or $x = 3$",
      option4: "$x = \\frac{7 \\pm \\sqrt{25}}{4}$",
      correct_mcq_option: 1,
      explanation:
        "Using $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$, we get $x = \\frac{7 \\pm \\sqrt{49 - 24}}{4} = \\frac{7 \\pm 5}{4}$. So $x = 3$ or $x = \\frac{1}{2}$.",
      concepts: [
        { id: "c1", name: "Quadratic Formula" },
        { id: "c2", name: "Discriminant" },
      ],
    }),
  },
};
