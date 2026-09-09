import { useState } from "react";

type Props = {
  testName: string;
  examType: string;
  durationMinutes: number;
  totalQuestions: number;
  onProceed: () => void;
};

export function InstructionsGate({
  testName,
  examType,
  durationMinutes,
  totalQuestions,
  onProceed,
}: Props) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-4 bg-white p-6 text-sm text-slate-800 shadow">
      <h1 className="text-xl font-bold text-[#1e3a5f]">General Instructions</h1>
      <p className="text-slate-600">
        <span className="font-semibold">{testName}</span> ·{" "}
        {examType.replaceAll("_", " ").toUpperCase()} · {durationMinutes}{" "}
        minutes · {totalQuestions} questions
      </p>
      <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
        <li>
          The countdown timer at the top right shows the time remaining. When it
          reaches zero, the exam will submit automatically.
        </li>
        <li>
          The Question Palette on the right shows status: Not Visited (white),
          Not Answered (red), Answered (green), Marked for Review (purple),
          Answered &amp; Marked for Review (purple with green mark).
        </li>
        <li>
          To answer an MCQ, select an option, then click{" "}
          <strong>Save &amp; Next</strong>. Selecting alone does not save the
          response.
        </li>
        <li>
          Use <strong>Mark for Review &amp; Next</strong> to flag a question
          without saving an answer, or{" "}
          <strong>Save &amp; Mark for Review</strong> to save and flag. Answers
          that are saved and marked for review <em>are</em> evaluated.
        </li>
        <li>
          Use <strong>Clear Response</strong> to remove the selected answer for
          the current question.
        </li>
        <li>
          You may navigate freely between sections and questions at any time
          during the examination.
        </li>
        <li>
          Clicking a palette number opens that question but does not save the
          current answer — use Save &amp; Next first if needed.
        </li>
        <li>
          Numerical / integer answers must be entered using the on-screen input
          (keyboard entry is supported in this practice interface).
        </li>
      </ol>
      <label className="flex items-start gap-2 rounded border border-slate-300 bg-slate-50 p-3">
        <input
          type="checkbox"
          className="mt-1"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <span>
          I have read and understood the instructions. All computer hardware
          allotted to me are in proper working condition. I declare that I am
          not in possession of / not wearing / not carrying any prohibited
          gadget.
        </span>
      </label>
      <button
        type="button"
        disabled={!agreed}
        onClick={onProceed}
        className="rounded bg-[#1e3a5f] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Proceed
      </button>
    </div>
  );
}
