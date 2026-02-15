import type { QgenDraftSection } from "@skolist/db";

export const SectionHeader = ({
  section,
  totalMarks,
}: {
  section: QgenDraftSection;
  totalMarks?: number;
}) => (
  <div
    className="relative flex items-baseline justify-center"
    style={{
      marginTop: "var(--section-margin-top)",
      marginBottom: "var(--section-margin-bottom)",
    }}
  >
    <h3 className="text-lg font-bold uppercase underline">
      {section.section_name}
    </h3>
    {totalMarks !== undefined && totalMarks > 0 && (
      <span className="absolute right-0 whitespace-nowrap text-sm font-bold text-black">
        [{totalMarks}]
      </span>
    )}
  </div>
);
