import { useState } from "react";
import { LatexRenderer } from "../LatexRenderer";

interface AnswerToggleProps {
  answer: string;
  truncateLength?: number;
}

export function AnswerToggle({
  answer,
  truncateLength = 100,
}: AnswerToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const needsTruncation = answer.length > truncateLength;
  const displayText = isExpanded ? answer : answer.slice(0, truncateLength);

  return (
    <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
      <span className="font-semibold text-primary">Answer: </span>
      <span className="inline">
        <LatexRenderer content={displayText} />
        {!isExpanded && needsTruncation && "..."}
      </span>
      {needsTruncation && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-1 text-blue-600 underline hover:text-blue-800 focus:outline-none"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
