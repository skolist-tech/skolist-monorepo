import { FileText } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <FileText className="h-6 w-6 text-primary" />
      <span className="text-lg font-semibold">Skolist Q-GEN</span>
    </div>
  );
}
