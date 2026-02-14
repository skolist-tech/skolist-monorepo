import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { Info, GripVertical, Lightbulb, Dumbbell } from "lucide-react";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";

interface QuestionCardBottomBarProps {
  question: GeneratedQuestionWithConcepts;
  dragHandleProps?: Record<string, any>;
}

export function QuestionCardBottomBar({
  question,
  dragHandleProps,
}: QuestionCardBottomBarProps) {
  return (
    <div className="absolute bottom-2 right-2 z-10 flex flex-col items-end gap-1">
      {dragHandleProps && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 cursor-grab touch-none text-muted-foreground hover:text-primary active:cursor-grabbing"
                {...dragHandleProps}
              >
                <GripVertical className="!h-6 !w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Drag to Reorder</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <div className="flex items-center gap-2">
        {question.is_solved_example && (
          <Badge
            variant="secondary"
            className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 md:hidden"
          >
            <Lightbulb className="h-3 w-3" />
            Solved Example
          </Badge>
        )}
        {question.is_exercise_question && (
          <Badge
            variant="secondary"
            className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100 md:hidden"
          >
            <Dumbbell className="h-3 w-3" />
            Exercise
          </Badge>
        )}
        {question.is_new && !question.is_in_draft && (
          <Badge
            variant="secondary"
            className="relative overflow-hidden border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 shadow-[0_2px_8px_rgba(59,130,246,0.25)]"
          >
            <span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/60 to-transparent"
              style={{
                animation: "shimmer 2s ease-in-out infinite",
              }}
            />
            <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
            <span className="relative">New</span>
          </Badge>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <div>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-primary"
                    >
                      <Info className="!h-6 !w-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>View Concepts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <h4 className="mb-2 text-sm font-medium leading-none">
              Related Concepts
            </h4>
            <div className="flex flex-wrap gap-1">
              {question.concepts && question.concepts.length > 0 ? (
                question.concepts.map((concept) => (
                  <Badge
                    key={concept.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {concept.name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  No concepts linked
                </span>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
