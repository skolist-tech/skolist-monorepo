import { PaperStructure } from "./PaperStructure";
import { PaperPreview } from "./PaperPreview";

export function DraftPane() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Left Pane - Structure (55%) */}
      <div className="flex h-full w-[55%] min-w-[320px] max-w-[900px] flex-col border-r">
        <PaperStructure />
      </div>

      {/* Right Pane - Preview (45%) */}
      <div className="flex h-full min-w-0 flex-1 flex-col bg-muted/30">
        <PaperPreview />
      </div>
    </div>
  );
}
