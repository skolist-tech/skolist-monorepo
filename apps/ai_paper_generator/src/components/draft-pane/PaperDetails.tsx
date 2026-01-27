import { EditableField } from "./structure/EditableField";
import { minsToTime, timeToMins } from "./structure/utils";
import { PaperLogoSection } from "./PaperLogoSection";
import { PaperInstructionsSection } from "./PaperInstructionsSection";
import type { QgenDraft, UpdateQgenDraft } from "@skolist/db";

interface PaperDetailsProps {
  draft: QgenDraft;
  updateDraftSettings: (updates: UpdateQgenDraft) => Promise<void>;
}

export function PaperDetails({
  draft,
  updateDraftSettings,
}: PaperDetailsProps) {
  return (
    <div className="space-y-6 p-4">
      {/* Basic Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <EditableField
            label="Institute Name"
            value={draft.institute_name || ""}
            placeholder="Enter Institute Name"
            onSave={(val) =>
              updateDraftSettings({ institute_name: String(val) })
            }
          />
          <EditableField
            label="Paper Title"
            value={draft.paper_title || ""}
            placeholder="Enter Paper Title"
            onSave={(val) => updateDraftSettings({ paper_title: String(val) })}
          />
        </div>

        {/* New Metadata Fields */}
        <div className="grid grid-cols-2 gap-4">
          <EditableField
            label="Subject"
            value={draft.subject_name || ""}
            placeholder="Science"
            onSave={(val) => updateDraftSettings({ subject_name: String(val) })}
          />
          <EditableField
            label="Class"
            value={draft.school_class_name || ""}
            placeholder="Class X"
            onSave={(val) =>
              updateDraftSettings({ school_class_name: String(val) })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <EditableField
            label="Time (mins)"
            type="number"
            value={timeToMins(draft.paper_duration)}
            placeholder="60"
            onSave={(val) =>
              updateDraftSettings({ paper_duration: minsToTime(val) })
            }
          />
          <EditableField
            label="Max Marks"
            type="number"
            value={draft.maximum_marks || 0}
            placeholder="100"
            onSave={(val) =>
              updateDraftSettings({ maximum_marks: Number(val) })
            }
          />
        </div>

        {/* Logo Section */}
        <PaperLogoSection
          draft={draft}
          updateDraftSettings={updateDraftSettings}
        />
      </div>

      {/* Instructions */}
      <PaperInstructionsSection draft={draft} />
    </div>
  );
}
