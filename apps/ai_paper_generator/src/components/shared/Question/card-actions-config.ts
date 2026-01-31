export type ActionId =
  | "undo"
  | "redo"
  | "auto_correct"
  | "attachment"
  | "regenerate"
  | "regenerate_with_prompt"
  | "camera_capture"
  | "move"
  | "delete"
  | "edit";

export interface ActionConfig {
  id: ActionId;
  label: string;
  mobile: {
    location: "card" | "menu"; // 'card' = visible on card outside, 'menu' = inside 3-dots
    order: number;
    visible: boolean; // whether to show the button on mobile
  };
  desktop: {
    order: number;
    visible: boolean; // whether to show the button on desktop
  };
}

export const CARD_ACTIONS_CONFIG: ActionConfig[] = [
  {
    id: "undo",
    label: "Undo",
    mobile: { location: "menu", order: 10, visible: false },
    desktop: { order: 10, visible: false },
  },
  {
    id: "redo",
    label: "Redo",
    mobile: { location: "menu", order: 20, visible: false },
    desktop: { order: 20, visible: false },
  },
  {
    id: "auto_correct",
    label: "Auto-Correct",
    mobile: { location: "card", order: 30, visible: true },
    desktop: { order: 30, visible: true },
  },
  {
    id: "attachment",
    label: "Attach Figure",
    mobile: { location: "menu", order: 40, visible: true },
    desktop: { order: 40, visible: true },
  },
  {
    id: "regenerate",
    label: "Regenerate",
    mobile: { location: "card", order: 50, visible: true },
    desktop: { order: 50, visible: true },
  },
  {
    id: "regenerate_with_prompt",
    label: "Regenerate with Prompt",
    mobile: { location: "menu", order: 60, visible: true },
    desktop: { order: 60, visible: true },
  },
  {
    id: "camera_capture",
    label: "Capture Photo",
    mobile: { location: "card", order: 25, visible: true },
    desktop: { order: 25, visible: false },
  },
  {
    id: "edit",
    label: "Edit Question",
    mobile: { location: "menu", order: 70, visible: true },
    desktop: { order: 70, visible: true },
  },
  {
    id: "move",
    label: "Move", // Label changes dynamically based on state (Move to Draft / Remove from Draft)
    mobile: { location: "card", order: 80, visible: true },
    desktop: { order: 80, visible: true },
  },
  {
    id: "delete",
    label: "Delete",
    mobile: { location: "menu", order: 90, visible: true },
    desktop: { order: 90, visible: true },
  },
];
