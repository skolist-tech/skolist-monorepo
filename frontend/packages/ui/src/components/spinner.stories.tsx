import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./spinner";

const meta = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const InButton: Story = {
  render: () => (
    <button
      disabled
      className="bg-primary text-primary-foreground inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium opacity-50"
    >
      <Spinner size="sm" className="text-primary-foreground" />
      Loading...
    </button>
  ),
};

export const FullPage: Story = {
  render: () => (
    <div className="flex h-[200px] w-[300px] items-center justify-center rounded-md border">
      <Spinner size="lg" />
    </div>
  ),
};
