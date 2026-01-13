import { Button } from "@skolist/ui";
import { Sparkles } from "lucide-react";

interface AutoDecideButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function AutoDecideButton({
  onClick,
  disabled,
  isLoading,
  className,
}: AutoDecideButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      className={`gap-2 ${className || ""}`}
    >
      <Sparkles className="h-4 w-4" />
      {isLoading ? (
        "Calculating..."
      ) : (
        <span className="hidden xl:inline">Auto</span>
      )}
      {!isLoading && <span className="xl:hidden">Auto</span>}
    </Button>
  );
}
