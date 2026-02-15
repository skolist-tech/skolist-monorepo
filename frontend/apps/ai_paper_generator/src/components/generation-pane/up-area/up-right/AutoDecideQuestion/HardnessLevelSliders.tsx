import { Slider } from "@skolist/ui";
import { cn } from "@skolist/utils";
import type { HardnessLevel } from "@skolist/db";

interface HardnessLevelSlidersProps {
  levels: Record<HardnessLevel, number>;
  onLevelChange: (level: HardnessLevel, value: number) => void;
  totalQuestions?: number;
  headerElement?: React.ReactNode;
}

export function HardnessLevelSliders({
  levels,
  onLevelChange,
  totalQuestions = 0,
  headerElement,
}: HardnessLevelSlidersProps) {
  // Calculate slider values from percentages
  // v1 = easy
  // v2 = easy + medium
  const sliderValue = [levels.easy, levels.easy + levels.medium];

  const handleSliderChange = (values: number[]) => {
    const [v1 = 33, v2 = 66] = values;

    // Calculate percentages from slider values
    const easy = v1;
    const medium = v2 - v1;
    const hard = 100 - v2;

    onLevelChange("easy", easy);
    onLevelChange("medium", medium);
    onLevelChange("hard", hard);
  };

  // Calculate question counts properly summing to totalQuestions
  const calculateCounts = () => {
    if (!totalQuestions) return { easy: 0, medium: 0, hard: 0 };

    const floatCounts = [
      (levels.easy / 100) * totalQuestions,
      (levels.medium / 100) * totalQuestions,
      (levels.hard / 100) * totalQuestions,
    ];

    const floors = floatCounts.map(Math.floor);
    const sumFloors = floors.reduce((a, b) => a + b, 0);
    const remainder = totalQuestions - sumFloors;

    // Distribute remainder to largest fractions
    const fractions = floatCounts.map((val, idx) => ({
      val: val - (floors[idx] ?? 0),
      idx,
    }));
    fractions.sort((a, b) => b.val - a.val);

    for (let i = 0; i < remainder; i++) {
      const item = fractions[i % 3];
      if (item) {
        const current = floors[item.idx];
        if (current !== undefined) {
          floors[item.idx] = current + 1;
        }
      }
    }

    return {
      easy: floors[0],
      medium: floors[1],
      hard: floors[2],
    };
  };

  const counts = calculateCounts();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-x-4 lg:gap-y-4">
        {headerElement && <div className="flex-shrink-0">{headerElement}</div>}
        <div className={cn("w-full px-1", !headerElement && "col-span-2")}>
          <Slider
            defaultValue={[33, 66]}
            value={sliderValue}
            max={100}
            step={1}
            minStepsBetweenThumbs={0}
            onValueChange={handleSliderChange}
            className="w-full [&>span:first-child>span]:!bg-yellow-500 [&>span:first-child]:!bg-[linear-gradient(to_right,rgb(34,197,94)_0%,rgb(34,197,94)_var(--v1),transparent_var(--v1),transparent_var(--v2),rgb(249,115,22)_var(--v2),rgb(249,115,22)_100%)]"
            style={
              {
                "--v1": `${sliderValue[0]}%`,
                "--v2": `${sliderValue[1]}%`,
              } as React.CSSProperties
            }
          />
        </div>

        {headerElement && <div className="hidden lg:block" />}
        <div
          className={cn(
            "grid w-full grid-cols-3 text-xs",
            !headerElement && "col-span-2"
          )}
        >
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <div className="h-3 w-3 rounded-full border border-green-500 bg-green-500/20" />
              <span className="">Easy ({levels.easy}%)</span>
            </div>
            <span className="whitespace-nowrap text-muted-foreground">
              {counts.easy} Questions
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <div className="h-3 w-3 rounded-full border border-yellow-500 bg-yellow-500/20" />
              <span className="">Medium ({levels.medium}%)</span>
            </div>
            <span className="whitespace-nowrap text-muted-foreground">
              {counts.medium} Questions
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <div className="h-3 w-3 rounded-full border border-orange-500 bg-orange-500/20" />
              <span className="">Hard ({levels.hard}%)</span>
            </div>
            <span className="whitespace-nowrap text-muted-foreground">
              {counts.hard} Questions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
