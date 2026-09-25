import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@skolist/ui";
import { BackLink } from "@/components/layout/BackLink";
import { cloneBlueprint, listBlueprints } from "@/services/tests";
import type { BlueprintSummary } from "@/types/assessment";

export function CreateTestPage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<"choose" | "full">("choose");
  const [blueprints, setBlueprints] = useState<BlueprintSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== "full") return;
    listBlueprints()
      .then((data) => setBlueprints(data.blueprints))
      .catch((err: Error) => setError(err.message));
  }, [kind]);

  return (
    <div className="space-y-6">
      <BackLink to="/teacher/tests" />
      <h1 className="text-3xl font-bold">Create test</h1>
      {kind === "choose" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Full Syllabus Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => setKind("full")}>
                Full Syllabus Test
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Chapter Wise Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button type="button" disabled>
                Chapter Wise Test
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setKind("choose")}
          >
            Back to test type
          </Button>
          {error ? <p className="text-destructive">{error}</p> : null}
          <div className="grid gap-4 md:grid-cols-2">
            {blueprints.map((blueprint) => (
              <Card key={blueprint.id}>
                <CardHeader>
                  <CardTitle>{blueprint.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {blueprint.exam_type} · {blueprint.duration_minutes} min
                  </p>
                  <Button
                    type="button"
                    disabled={busyId === blueprint.id}
                    onClick={() => {
                      setBusyId(blueprint.id);
                      cloneBlueprint(blueprint.id)
                        .then((created) =>
                          navigate(`/teacher/tests/${created.id}`)
                        )
                        .catch((err: Error) => {
                          setError(err.message);
                          setBusyId(null);
                        });
                    }}
                  >
                    {blueprint.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
