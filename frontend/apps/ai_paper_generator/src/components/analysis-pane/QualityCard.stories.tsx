import type { Meta, StoryObj } from "@storybook/react";
import { QualityCard } from "./QualityCard";

const meta = {
  title: "AI Paper Generator/Analysis Pane/QualityCard",
  component: QualityCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    percentile: {
      control: { type: "range", min: 1, max: 100, step: 1 },
      description: "Percentile ranking compared to other teachers (1-100)",
    },
  },
} satisfies Meta<typeof QualityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    percentile: 75,
  },
};

export const Low: Story = {
  args: {
    percentile: 25,
  },
};

export const Average: Story = {
  args: {
    percentile: 50,
  },
};

export const High: Story = {
  args: {
    percentile: 90,
  },
};

export const Top: Story = {
  args: {
    percentile: 100,
  },
};
