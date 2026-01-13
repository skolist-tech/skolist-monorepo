import { Slider } from "@skolist/ui";
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

  const getCount = (percentage: number) => {
    if (!totalQuestions) return 0;
    return Math.round((percentage / 100) * totalQuestions);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {headerElement && (
          <div className="flex-shrink-0 pt-2">{headerElement}</div>
        )}
        <div className="w-full flex-grow space-y-4">
          <div className="px-1 pt-2">
            <Slider
              defaultValue={[33, 66]}
              value={sliderValue}
              max={100}
              step={1}
              minStepsBetweenThumbs={5}
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

          <div className="flex w-full text-xs text-muted-foreground">
            <div
              style={{ width: `${levels.easy}%` }}
              className="flex flex-col items-start gap-1 transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <div className="h-3 w-3 rounded-full border border-green-500 bg-green-500/20" />
                <span>Easy ({levels.easy}%)</span>
              </div>
              <span className="whitespace-nowrap font-medium text-foreground">
                {getCount(levels.easy)} Questions
              </span>
            </div>

            <div
              style={{ width: `${levels.medium}%` }}
              className="flex flex-col items-center gap-1 transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <div className="h-3 w-3 rounded-full border border-yellow-500 bg-yellow-500/20" />
                <span>Medium ({levels.medium}%)</span>
              </div>
              <span className="whitespace-nowrap font-medium text-foreground">
                {getCount(levels.medium)} Questions
              </span>
            </div>

            <div
              style={{ width: `${levels.hard}%` }}
              className="flex flex-col items-end gap-1 transition-all duration-300 ease-in-out"
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <div className="h-3 w-3 rounded-full border border-orange-500 bg-orange-500/20" />
                <span>Hard ({levels.hard}%)</span>
              </div>
              <span className="whitespace-nowrap font-medium text-foreground">
                {getCount(levels.hard)} Questions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="text-center text-xs italic text-muted-foreground">
        Drag the sliders to adjust the distribution
      </div> */}
    </div>
  );
}
