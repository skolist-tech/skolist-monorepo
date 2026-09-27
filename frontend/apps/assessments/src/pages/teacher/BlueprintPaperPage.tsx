import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PaperView } from "@/components/shared/PaperView";
import { getBlueprint } from "@/services/tests";
import type { BlueprintDetail } from "@/types/assessment";

export function BlueprintPaperPage() {
  const { blueprintId } = useParams();
  const [paper, setPaper] = useState<BlueprintDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blueprintId) return;
    getBlueprint(blueprintId)
      .then(setPaper)
      .catch((err: Error) => setError(err.message));
  }, [blueprintId]);

  if (error) {
    return <p className="p-8 text-center text-red-600">{error}</p>;
  }
  if (!paper) {
    return <p className="p-8 text-center text-slate-600">Loading paper…</p>;
  }

  return (
    <PaperView
      paper={paper}
      subtitle="Preview · view only. Use this test to make an editable copy."
      backTo={{
        href: "/teacher/tests/new?kind=full",
        label: "Back to create test",
      }}
    />
  );
}
