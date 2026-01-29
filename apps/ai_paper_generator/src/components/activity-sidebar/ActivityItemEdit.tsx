import { Input } from "@skolist/ui";
import { Check, X } from "lucide-react";
import type { RefObject } from "react";

interface ActivityItemEditProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  inputRef: RefObject<HTMLInputElement>;
}

export function ActivityItemEdit({
  value,
  onChange,
  onSave,
  onCancel,
  inputRef,
}: ActivityItemEditProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onSave}
        className="h-7 text-sm"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          onSave();
        }}
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        type="button"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
