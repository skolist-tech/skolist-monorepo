import type { QgenDraftInstructionAndQgenDraft } from "@skolist/db";

export const PaperInstructions = ({
  instructions,
}: {
  instructions: QgenDraftInstructionAndQgenDraft[];
}) => {
  if (!instructions || instructions.length === 0) return null;
  return (
    <div
      className="border-b-2 border-black"
      style={{
        marginBottom: "var(--instructions-margin-bottom)",
        paddingBottom: "var(--instructions-padding-bottom)",
      }}
    >
      <h3
        className="text-sm font-bold text-black"
        style={{ marginBottom: "var(--instructions-title-margin-bottom)" }}
      >
        General Instructions:
      </h3>
      <ol
        className="list-outside list-decimal text-sm font-medium text-black"
        style={{
          paddingLeft: "var(--instructions-list-padding-left)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--instructions-item-gap)",
        }}
      >
        {instructions.map((inst) => (
          <li key={inst.id} className="pl-1">
            {inst.instruction_text}
          </li>
        ))}
      </ol>
    </div>
  );
};
