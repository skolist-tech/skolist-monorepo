import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { EditSvgDialog } from "./EditSvgDialog";

// Sample SVG for testing
const SAMPLE_CIRCLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="80" fill="none" stroke="black" stroke-width="2"/>
  <line x1="100" y1="100" x2="180" y2="100" stroke="black" stroke-width="2"/>
  <text x="130" y="90" font-size="14">r</text>
  <text x="95" y="120" font-size="14">O</text>
</svg>`;

const SAMPLE_TRIANGLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <polygon points="100,20 180,180 20,180" fill="none" stroke="black" stroke-width="2"/>
  <text x="95" y="15" font-size="12">A</text>
  <text x="180" y="190" font-size="12">B</text>
  <text x="10" y="190" font-size="12">C</text>
</svg>`;

const SAMPLE_ANGLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <line x1="20" y1="180" x2="180" y2="180" stroke="black" stroke-width="2"/>
  <line x1="20" y1="180" x2="150" y2="50" stroke="black" stroke-width="2"/>
  <path d="M 60 180 A 40 40 0 0 1 50 155" fill="none" stroke="black" stroke-width="1"/>
  <text x="65" y="165" font-size="14">θ</text>
</svg>`;

// Wrapper component to handle state for Storybook
function EditSvgDialogWrapper({
  initialSvg,
  open: initialOpen = true,
}: {
  initialSvg: string;
  open?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [svg, setSvg] = useState(initialSvg);

  const mockImage = {
    id: "test-image-id",
    svg_string: svg,
    gen_question_id: "test-question-id",
    position: 0,
    img_url: null,
    file_path: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handleSave = async (imageId: string, svgString: string) => {
    console.log("Saving SVG:", { imageId, svgString });
    setSvg(svgString);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const handleAiUpdate = (imageId: string, svgString: string) => {
    console.log("AI Updated SVG:", { imageId, svgString });
    setSvg(svgString);
  };

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Open Edit Dialog
      </button>
      <EditSvgDialog
        image={mockImage}
        open={open}
        onOpenChange={setOpen}
        onSave={handleSave}
        onAiUpdate={handleAiUpdate}
      />
    </div>
  );
}

const meta = {
  title: "AI Paper Generator/Question/EditSvgDialog",
  component: EditSvgDialogWrapper,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EditSvgDialogWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story with a simple circle diagram
 */
export const Circle: Story = {
  args: {
    initialSvg: SAMPLE_CIRCLE_SVG,
    open: true,
  },
};

/**
 * Triangle with labeled vertices
 */
export const Triangle: Story = {
  args: {
    initialSvg: SAMPLE_TRIANGLE_SVG,
    open: true,
  },
};

/**
 * Angle diagram with theta label
 */
export const Angle: Story = {
  args: {
    initialSvg: SAMPLE_ANGLE_SVG,
    open: true,
  },
};

/**
 * Dialog in closed state - click button to open
 */
export const Closed: Story = {
  args: {
    initialSvg: SAMPLE_CIRCLE_SVG,
    open: false,
  },
};
