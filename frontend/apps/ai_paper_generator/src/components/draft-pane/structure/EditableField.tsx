import { useState, useEffect, useRef } from "react";
import { Button, Input, Label } from "@skolist/ui";
import { Pencil } from "lucide-react";

export const EditableField = ({
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
