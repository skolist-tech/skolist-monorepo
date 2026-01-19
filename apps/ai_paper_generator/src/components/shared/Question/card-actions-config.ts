export type ActionId =
  | "undo"
  | "redo"
  | "auto_correct"
  | "attachment"
  | "regenerate"
  | "regenerate_with_prompt"
  | "move"
  | "delete"
  | "edit";

export interface ActionConfig {
  id: ActionId;
  label: string;
  mobile: {
    location: "card" | "menu"; // 'card' = visible on card outside, 'menu' = inside 3-dots
    order: number;
  };
  desktop: {
    order: number;
  };
}

export const CARD_ACTIONS_CONFIG: ActionConfig[] = [
  {
    id: "undo",
    label: "Undo",
    mobile: { location: "menu", order: 10 },
    desktop: { order: 10 },
  },
  {
    id: "redo",
    label: "Redo",
    mobile: { location: "menu", order: 20 },
    desktop: { order: 20 },
  },
  {
    id: "auto_correct",
    label: "Auto-Correct",
    mobile: { location: "card", order: 30 },
    desktop: { order: 30 },
  },
  {
    id: "attachment",
    label: "Attach Image",
    mobile: { location: "menu", order: 40 },
    desktop: { order: 40 },
  },
  {
    id: "regenerate",
    label: "Regenerate",
    mobile: { location: "card", order: 50 },
    desktop: { order: 50 },
  },
  {
    id: "regenerate_with_prompt",
    label: "Regenerate with Prompt",
    mobile: { location: "menu", order: 60 },
    desktop: { order: 60 },
  },
  {
    id: "edit",
    label: "Edit Question",
    mobile: { location: "menu", order: 70 },
    desktop: { order: 70 },
  },
  {
    id: "move",
    label: "Move", // Label changes dynamically based on state (Move to Draft / Remove from Draft)
    mobile: { location: "menu", order: 80 },
    desktop: { order: 80 },
  },
  {
    id: "delete",
    label: "Delete",
    mobile: { location: "menu", order: 90 },
    desktop: { order: 90 },
  },
];
