import type { Meta, StoryObj } from "@storybook/react";
import { LoadingQuestionCard } from "./LoadingQuestionCard";

const meta = {
  title: "AI Paper Generator/Question/LoadingQuestionCard",
  component: LoadingQuestionCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoadingQuestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// DEFAULT STATE
// ============================================================================

/**
 * The default loading card shown during question generation.
 * Features:
 * - Circular timer with gradient ring (starts at 30s, extends by 10s at 5s)
 * - Animated gradient text with dots animation
 * - Shimmer effect overlay
 * - Floating animation
 */
export const Default: Story = {};

// ============================================================================
// IN CONTEXT - SIMULATING GENERATION
// ============================================================================

/**
 * Shows the loading card in context, as it would appear during generation.
 * The card is placed between "new questions" and "old questions".
 */
export const InContext: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-3xl space-y-4">
        {/* Simulated new questions above */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">New Question 1</div>
          <div className="mt-2 font-medium">
            What is the derivative of $f(x) = x^2$?
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">New Question 2</div>
          <div className="mt-2 font-medium">
            Solve the equation $2x + 5 = 15$
          </div>
        </div>

        {/* Loading card */}
        <Story />

        {/* Simulated old questions below */}
        <div className="rounded-lg border bg-card p-4 opacity-60 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Old Question (existing)
          </div>
          <div className="mt-2 font-medium">
            Calculate the area of a circle with radius 5
          </div>
        </div>
      </div>
    ),
  ],
};

// ============================================================================
// DARK MODE (if supported by your Storybook setup)
// ============================================================================

/**
 * Loading card in dark mode context.
 */
export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div className="dark max-w-3xl rounded-lg bg-slate-900 p-6">
        <Story />
      </div>
    ),
  ],
};
