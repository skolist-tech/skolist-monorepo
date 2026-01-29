import { type FeedbackItem } from "../../../hooks/useFeedback";

interface FeedbackListProps {
  feedbacks: FeedbackItem[];
}

export function FeedbackList({ feedbacks }: FeedbackListProps) {
  return (
    <ul className="space-y-3">
      {feedbacks
        .sort((a, b) => b.priority - a.priority)
        .map((feedback, index) => (
          <li
            key={index}
            className="group flex items-start gap-3 rounded-lg border border-transparent p-2.5 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/50"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-[10px] font-bold text-white shadow-sm">
              {index + 1}
            </span>
            <span className="text-sm leading-relaxed">{feedback.message}</span>
          </li>
        ))}
    </ul>
  );
}
