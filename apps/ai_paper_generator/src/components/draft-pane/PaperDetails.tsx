import { useState, useEffect, useRef } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button, Input, Label, Textarea, Switch } from "@skolist/ui";
import type { QgenDraft, UpdateQgenDraft } from "@skolist/db";
import type { QgenInstruction } from "../../services/draftService";
import { useDraftContext } from "../../context/DraftContext";

interface PaperDetailsProps {
  draft: QgenDraft;
  updateDraftSettings: (updates: UpdateQgenDraft) => Promise<void>;
}

// Helper component for editable fields
const EditableField = ({
  label,
  value,
  onSave,
  type = "text",
  placeholder = "Click strict pencil to edit",
}: {
  label: string;
  value: string | number;
  onSave: (val: string | number) => void;
  type?: "text" | "number";
  placeholder?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when prop changes (unless editing)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  const handleSave = () => {
    onSave(type === "number" ? Number(localValue) : localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div className="group relative space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef} // Just for auto-focus if we wanted
            autoFocus
            type={type}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave} // Standard behavior: save on blur
            className="h-8 pr-8"
          />
          {/* Icons could be inside input, but simple append works */}
        </div>
      ) : (
        <div className="relative flex min-h-[32px] items-center rounded-md border border-transparent bg-muted/40 px-3 py-1 text-sm hover:bg-muted/60">
          <span className="flex-1 truncate font-medium">
            {value || (
              <span className="text-muted-foreground opacity-50">
                {placeholder}
              </span>
            )}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Helper to convert "HH:MM:SS" or "HH:MM" to minutes number
const timeToMins = (timeStr: string | null): number => {
  if (!timeStr) return 0;
  // Handle "60 mins" legacy format if any
  if (timeStr.includes("mins")) {
    return parseInt(timeStr) || 0;
  }
  // Handle HH:MM:SS
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h!) || isNaN(m!)) return 0;
  return (h || 0) * 60 + (m || 0);
};

// Helper to convert minutes number to "HH:MM:00" for Postgres time/interval
const minsToTime = (mins: number | string): string => {
  const m = Number(mins);
  if (isNaN(m)) return "00:00:00";
  const hours = Math.floor(m / 60);
  const minutes = Math.floor(m % 60);
  // Pad with leading zeros
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${hh}:${mm}:00`;
};

export function PaperDetails({
  draft,
  updateDraftSettings,
}: PaperDetailsProps) {
  const { instructions, addInstruction, editInstruction, removeInstruction } =
    useDraftContext();
  const [newInstructionText, setNewInstructionText] = useState("");
  const [isAddingInstruction, setIsAddingInstruction] = useState(false);
  const [isLogoSectionOpen, setIsLogoSectionOpen] = useState(!!draft.logo_url);

  useEffect(() => {
    if (draft.logo_url) setIsLogoSectionOpen(true);
  }, [draft.logo_url]);

  const handleAddInstruction = async () => {
    if (!newInstructionText.trim() || !draft.id) return;
    try {
      await addInstruction(newInstructionText);
      setNewInstructionText("");
      setIsAddingInstruction(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInstruction = async (id: string) => {
    try {
      await removeInstruction(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInstruction = async (id: string, text: string) => {
    try {
      await editInstruction(id, text);
    } catch (err) {
      console.error(err);
    }
  };

  // Edit instruction component (inline)
  const InstructionItem = ({ item }: { item: QgenInstruction }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.instruction_text || "");

    const save = () => {
      if (text !== item.instruction_text) {
        handleUpdateInstruction(item.id, text);
      }
      setIsEditing(false);
    };

    return (
      <div className="group flex items-start justify-between gap-2 rounded border border-transparent p-2 hover:border-border hover:bg-muted/10">
        {isEditing ? (
          <div className="flex-1 space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[60px] text-xs"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-6 text-xs" onClick={save}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="flex-1 whitespace-pre-wrap text-xs text-muted-foreground">
              {item.instruction_text}
            </p>
            <div className="flex">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={() => handleDeleteInstruction(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

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
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              SHOW LOGO ON PAPER
            </Label>
            <div className="flex h-5 items-center">
              <Switch
                checked={!!draft.logo_url || isLogoSectionOpen}
                onCheckedChange={(checked) => {
                  setIsLogoSectionOpen(checked);
                  if (!checked) {
                    updateDraftSettings({ logo_url: null });
                  }
                }}
              />
            </div>
          </div>

          {(!!draft.logo_url || isLogoSectionOpen) && (
            <div className="mt-2">
              <div className="flex items-center gap-3">
                {draft.logo_url ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded border bg-white p-1">
                    <img
                      src={draft.logo_url}
                      alt="Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded border border-dashed bg-muted/20" />
                )}

                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="logo-upload"
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Upload className="h-3.5 w-3.5 text-white" />
                    {draft.logo_url ? "Change Logo" : "Upload Logo"}
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const { uploadLogo } =
                            await import("../../services/draftService");
                          const { getCurrentUserId } =
                            await import("../../services/supabase");
                          const userId = await getCurrentUserId();

                          const url = await uploadLogo(file, userId);
                          if (url) {
                            updateDraftSettings({ logo_url: url });
                          }
                        } catch (err) {
                          console.error("Upload failed", err);
                          alert("Failed to upload logo.");
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2 border-t pt-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            General Instructions
          </Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-xs"
            onClick={() => setIsAddingInstruction(true)}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>

        {isAddingInstruction && (
          <div className="space-y-2 rounded-md border bg-muted/20 p-2">
            <Textarea
              placeholder="Type instruction..."
              className="min-h-[60px] text-xs"
              value={newInstructionText}
              onChange={(e) => setNewInstructionText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => setIsAddingInstruction(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-6 text-xs"
                onClick={handleAddInstruction}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {instructions.map((inst) => (
            <InstructionItem key={inst.id} item={inst} />
          ))}
          {instructions.length === 0 && !isAddingInstruction && (
            <div className="py-4 text-center text-xs italic text-muted-foreground">
              No instructions added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
