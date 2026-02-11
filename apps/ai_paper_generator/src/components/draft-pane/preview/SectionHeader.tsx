import type { QgenDraftSection } from "@skolist/db";

export const SectionHeader = ({
  section,
  totalMarks,
}: {
  section: QgenDraftSection;
  totalMarks?: number;
}) => (
  <div className="mb-4 mt-6 flex items-baseline justify-between">
    <h3 className="text-lg font-bold uppercase underline">
      {section.section_name}
    </h3>
    {totalMarks !== undefined && totalMarks > 0 && (
      <span className="whitespace-nowrap text-sm font-bold text-black">
        [{totalMarks}]
      </span>
    )}
  </div>
);
