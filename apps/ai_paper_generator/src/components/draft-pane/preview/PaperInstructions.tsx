import type { QgenDraftInstructionAndQgenDraft } from "@skolist/db";

export const PaperInstructions = ({
  instructions,
}: {
  instructions: QgenDraftInstructionAndQgenDraft[];
}) => {
  if (!instructions || instructions.length === 0) return null;
  return (
    <div className="mb-2 border-b-2 border-black pb-4">
      <h3 className="mb-1 text-sm font-bold text-black">
        General Instructions:
      </h3>
      <ol className="list-outside list-decimal space-y-1 pl-5 text-sm font-medium text-black">
        {instructions.map((inst) => (
          <li key={inst.id} className="pl-1">
            {inst.instruction_text}
          </li>
        ))}
      </ol>
    </div>
  );
};
