import type { Meta, StoryObj } from "@storybook/react";
import { SyllabusCard } from "./SyllabusCard";

const meta = {
  title: "AI Paper Generator/Analysis Pane/SyllabusCard",
  component: SyllabusCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    draftConceptCount: { control: "number" },
    totalActivityConcepts: { control: "number" },
  },
} satisfies Meta<typeof SyllabusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Zero: Story = {
  args: {
    draftConceptCount: 0,
    totalActivityConcepts: 100,
  },
};

export const LowCoverage: Story = {
  args: {
    draftConceptCount: 25,
    totalActivityConcepts: 100,
  },
};

export const MediumCoverage: Story = {
  args: {
    draftConceptCount: 65,
    totalActivityConcepts: 100,
  },
};

export const HighCoverage: Story = {
  args: {
    draftConceptCount: 90,
    totalActivityConcepts: 100,
  },
};

export const Complete: Story = {
  args: {
    draftConceptCount: 100,
    totalActivityConcepts: 100,
  },
};
