import { isAnswerable, paletteStatus } from "@/lib/ntaPalette";
import { PALETTE_LEGEND, paletteButtonClass } from "@/lib/ntaStyles";
import type {
  Section,
  StudentQuestion,
  StudentResponse,
} from "@/types/assessment";

type Props = {
  sections: Section<StudentQuestion>[];
  activeSectionId: string | null;
  currentQuestionId: string | null;
  responses: Record<string, StudentResponse>;
  onSelect: (questionId: string) => void;
  language: "en" | "hi";
};

export function QuestionPalette({
  sections,
  activeSectionId,
  currentQuestionId,
  responses,
  onSelect,
  language,
}: Props) {
  const active =
    sections.find((section) => section.id === activeSectionId) || sections[0];
  const answerable = (active?.questions || []).filter(isAnswerable);

  const counts = {
    not_visited: 0,
    not_answered: 0,
    answered: 0,
    marked: 0,
    answered_marked: 0,
  };
  for (const question of answerable) {
    counts[paletteStatus(question, responses[question.id])] += 1;
  }

  return (
    <aside className="flex h-full flex-col border-l border-slate-300 bg-[#f3f6fb]">
      <div className="border-b border-slate-300 bg-[#1e3a5f] px-3 py-2 text-sm font-semibold text-white">
        {language === "hi" ? "प्रश्न पैलेट" : "Question Palette"}
      </div>

      <div className="border-b border-slate-200 px-3 py-2 text-xs text-slate-700">
        <p className="font-semibold">{active?.name}</p>
        <p className="mt-1 text-slate-500">
          {language === "hi" ? "कुल प्रश्न" : "Questions"}: {answerable.length}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2 p-3">
        {answerable.map((question, index) => {
          const status = paletteStatus(question, responses[question.id]);
          return (
            <button
              key={question.id}
              type="button"
              className={paletteButtonClass(
                status,
                question.id === currentQuestionId
              )}
              onClick={() => onSelect(question.id)}
              title={`Q${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-auto space-y-2 border-t border-slate-200 p-3 text-xs text-slate-700">
        <p className="font-semibold">
          {language === "hi" ? "संकेत (Legend)" : "Legend"}
        </p>
        {PALETTE_LEGEND.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center text-[10px] font-bold ${item.className}`}
            >
              {counts[item.status]}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
