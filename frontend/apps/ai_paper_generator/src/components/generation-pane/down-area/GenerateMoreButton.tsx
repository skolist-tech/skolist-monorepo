import { useState } from "react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
  useToast,
} from "@skolist/ui";
import { Plus, Loader2, Send } from "lucide-react";
import { fastApiService } from "../../../services/fastApiService";
import { fetchActivityConcepts } from "../../../services/activityService";
import { useActivityContext } from "../../../context/ActivityContext";
import type { HardnessLevel, QuestionType } from "@skolist/db";
import { formatQuestionType } from "../../../utils/formatters";

// Mapping from frontend QuestionType to API question type (reused from UpArea)
const QUESTION_TYPE_API_MAP: Record<QuestionType, string> = {
  mcq4: "mcq4",
  msq4: "msq4",
  short_answer: "short_answer",
  long_answer: "long_answer",
  true_or_false: "true_false",
  fill_in_the_blanks: "fill_in_the_blank",
  match_the_following: "match_the_following",
};

// All available types for the dropdown
const AVAILABLE_TYPES: QuestionType[] = [
  "mcq4",
  "msq4",
  "short_answer",
  "long_answer",
  "true_or_false",
  "fill_in_the_blanks",
  "match_the_following",
];

interface GenerateMoreButtonProps {
  hardnessLevels: Record<HardnessLevel, number>;
}

export function GenerateMoreButton({
  hardnessLevels,
}: GenerateMoreButtonProps) {
  const { currentActivity } = useActivityContext();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<QuestionType>("mcq4");
  const [count, setCount] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!currentActivity?.id) {
      toast({
        title: "No Activity",
        description: "No active activity found.",
        variant: "destructive",
      });
      return;
    }

    if (count < 1) {
      toast({
        title: "Invalid Count",
        description: "Please enter a number greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Fetch concepts linked to this activity
      const conceptIds = await fetchActivityConcepts(currentActivity.id);

      if (conceptIds.length === 0) {
        toast({
          title: "No Concepts Found",
          description:
            "This activity has no concepts associated with it. Please generate initial questions first.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      // 2. Prepare payload
      const questionTypes = [
        {
          type: QUESTION_TYPE_API_MAP[selectedType],
          count: count,
        },
      ];

      // 3. Call API
      await fastApiService.generateQuestions({
        activity_id: currentActivity.id,
        concept_ids: conceptIds,
        config: {
          question_types: questionTypes,
          difficulty_distribution: hardnessLevels,
        },
      });

      toast({
        title: "Generated Successfully",
        description: `Started generating ${count} ${formatQuestionType(
          selectedType
        )} question(s).`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Failed to generate more questions:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed">
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Generate More
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Generate More</h4>
            <p className="text-sm text-muted-foreground">
              Add more questions for the same concepts.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="type">Type</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as QuestionType)}
              >
                <SelectTrigger id="type" className="col-span-2 h-8">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="capitalize">
                        {formatQuestionType(type)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                className="col-span-2 h-8"
              />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating} size="sm">
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Generate
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
