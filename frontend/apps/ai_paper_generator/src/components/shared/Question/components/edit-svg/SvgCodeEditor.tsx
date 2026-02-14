import { Textarea, Label } from "@skolist/ui";

interface SvgCodeEditorProps {
  /** Current SVG code */
  value: string;
  /** Callback when code changes */
  onChange: (value: string) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

/**
 * SVG code editor with monospace font
 */
export function SvgCodeEditor({
  value,
  onChange,
  disabled = false,
}: SvgCodeEditorProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <Label htmlFor="svg-editor">SVG Code</Label>
      <Textarea
        id="svg-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-0 flex-1 resize-none font-mono text-xs sm:text-sm"
        placeholder="Enter SVG code..."
        disabled={disabled}
      />
    </div>
  );
}
