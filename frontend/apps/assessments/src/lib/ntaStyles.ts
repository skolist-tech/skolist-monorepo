import type { PaletteStatus } from "@/types/assessment";

export const PALETTE_LEGEND: {
  status: PaletteStatus;
  label: string;
  className: string;
}[] = [
  {
    status: "not_visited",
    label: "Not Visited",
    className: "border border-slate-400 bg-white text-slate-800",
  },
  {
    status: "not_answered",
    label: "Not Answered",
    className: "bg-red-600 text-white",
  },
  {
    status: "answered",
    label: "Answered",
    className: "bg-green-600 text-white",
  },
  {
    status: "marked",
    label: "Marked for Review",
    className: "rounded-full bg-purple-700 text-white",
  },
  {
    status: "answered_marked",
    label: "Answered & Marked for Review",
    className:
      "relative rounded-full bg-purple-700 text-white after:absolute after:bottom-0.5 after:right-0.5 after:h-2 after:w-2 after:rounded-full after:bg-green-400",
  },
];

export function paletteButtonClass(
  status: PaletteStatus,
  isCurrent: boolean
): string {
  const base =
    "relative h-9 w-9 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500";
  const current = isCurrent ? " ring-2 ring-sky-500 ring-offset-1" : "";
  const byStatus: Record<PaletteStatus, string> = {
    not_visited: "border border-slate-400 bg-white text-slate-800",
    not_answered: "bg-red-600 text-white",
    answered: "bg-green-600 text-white",
    marked: "rounded-full bg-purple-700 text-white",
    answered_marked:
      "rounded-full bg-purple-700 text-white after:absolute after:bottom-0.5 after:right-0.5 after:h-2 after:w-2 after:rounded-full after:bg-green-400",
  };
  return `${base} ${byStatus[status]}${current}`;
}
