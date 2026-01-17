import type { Meta, StoryObj } from "@storybook/react";
import { DifficultyCard } from "./DifficultyCard";

const meta = {
  title: "AI Paper Generator/Analysis Pane/DifficultyCard",
  component: DifficultyCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    easyMarks: { control: "number" },
    mediumMarks: { control: "number" },
    hardMarks: { control: "number" },
  },
} satisfies Meta<typeof DifficultyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Easy: Story = {
  args: {
    easyMarks: 15,
    mediumMarks: 5,
    hardMarks: 2,
  },
};

export const Medium: Story = {
  args: {
    easyMarks: 5,
    mediumMarks: 15,
    hardMarks: 5,
  },
};

export const Hard: Story = {
  args: {
    easyMarks: 2,
    mediumMarks: 5,
    hardMarks: 15,
  },
};
