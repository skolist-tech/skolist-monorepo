import type { Section, TeacherQuestion } from "@/types/assessment";
import { QuestionEditor } from "./QuestionEditor";

export function SectionList({
  sections,
  editable = false,
  onAddQuestion,
  onSave,
}: {
  sections: Section<TeacherQuestion>[];
  editable?: boolean;
  onAddQuestion: (sectionId: string) => void;
  onSave?: (
    questionId: string,
    payload: Partial<TeacherQuestion>
  ) => Promise<void> | void;
}) {
  if (!sections.length) {
    return <p className="text-sm text-muted-foreground">No sections yet.</p>;
  }
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">
              {section.position}. {section.name}
            </h3>
            <button
              type="button"
              className="text-sm text-primary"
              onClick={() => onAddQuestion(section.id)}
            >
              Add question
            </button>
          </div>
          <div className="space-y-3">
            {section.questions.map((question) => (
              <QuestionEditor
                key={question.id}
                question={question}
                editable={editable}
                onSave={onSave}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
