import { useState } from "react";
import { PaperStructure } from "./PaperStructure";
import { PaperPreview } from "./PaperPreview";
import { Button } from "@skolist/ui";
import { FileText, Eye } from "lucide-react";
import { cn } from "@skolist/utils";

type MobileTab = "structure" | "preview";

export function DraftPane() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("structure");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background md:flex-row">
      {/* Mobile Tab Buttons */}
      <div className="flex border-b bg-muted/30 md:hidden">
        <Button
          variant="ghost"
          className={cn(
            "flex-1 rounded-none border-b-2 py-7 font-bold text-lg",
            mobileTab === "structure"
              ? "border-primary bg-background text-primary"
              : "border-transparent text-muted-foreground"
          )}
          onClick={() => setMobileTab("structure")}
        >
          <FileText className="mr-2 h-4 w-4" />
          Structure
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "flex-1 rounded-none border-b-2 py-7 font-bold text-lg",
            mobileTab === "preview"
              ? "border-primary bg-background text-primary"
              : "border-transparent text-muted-foreground"
          )}
          onClick={() => setMobileTab("preview")}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </div>

      {/* Left Pane - Structure (55% on desktop, full on mobile when active) */}
      <div
        className={cn(
          "flex h-full flex-col border-r md:w-[55%] md:min-w-[320px] md:max-w-[900px]",
          mobileTab === "structure" ? "flex" : "hidden md:flex"
        )}
      >
        <PaperStructure />
      </div>

      {/* Right Pane - Preview (45% on desktop, full on mobile when active) */}
      <div
        className={cn(
          "flex h-full min-w-0 flex-1 flex-col bg-muted/30",
          mobileTab === "preview" ? "flex" : "hidden md:flex"
        )}
      >
        <PaperPreview />
      </div>
    </div>
  );
}
