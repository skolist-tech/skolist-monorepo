import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@skolist/ui";
import { Plus, ArrowLeft } from "lucide-react";
import {
  type QgenDraftSection,
  QUESTION_TYPE,
  type QuestionType,
} from "@skolist/db";
import { useQuestionsContext } from "../../context/QuestionsContext";

export function AddCustomQuestionGlobal({
  sections,
}: {
  sections: QgenDraftSection[];
}) {
  const { addCustomQuestion } = useQuestionsContext();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );

  const handleClose = () => {
    setIsOpen(false);
    setSelectedSectionId(null);
  };

  const handleSectionSelect = (id: string) => {
    setSelectedSectionId(id);
  };

  const handleTypeSelect = async (type: string) => {
    if (!selectedSectionId) return;
    await addCustomQuestion(selectedSectionId, type as QuestionType);
    handleClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setSelectedSectionId(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          Add Question
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedSectionId ? "Select Question Type" : "Select Section"}
          </DialogTitle>
        </DialogHeader>

        {!selectedSectionId ? (
          <div className="grid gap-2">
            {sections.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No sections available. Please add a section first.
              </p>
            )}
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="outline"
                className="justify-start"
                onClick={() => handleSectionSelect(section.id)}
              >
                {section.section_name || "Untitled Section"}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 gap-2 text-muted-foreground"
              onClick={() => setSelectedSectionId(null)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sections
            </Button>
            <div className="grid gap-2">
              {[
                { label: "Short Answer", value: QUESTION_TYPE.SHORT_ANSWER },
                { label: "Long Answer", value: QUESTION_TYPE.LONG_ANSWER },
                { label: "MCQ", value: QUESTION_TYPE.MCQ4 },
                { label: "MSQ", value: QUESTION_TYPE.MSQ4 },
                { label: "True/False", value: QUESTION_TYPE.TRUE_OR_FALSE },
                {
                  label: "Fill in the Blanks",
                  value: QUESTION_TYPE.FILL_IN_THE_BLANKS,
                },
              ].map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleTypeSelect(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
