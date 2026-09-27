import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from "@skolist/ui";
import { BackLink } from "@/components/layout/BackLink";
import { cloneBlueprint, listBlueprints } from "@/services/tests";
import type { BlueprintSummary } from "@/types/assessment";

export function CreateTestPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = searchParams.get("kind") === "full" ? "full" : "choose";
  const [blueprints, setBlueprints] = useState<BlueprintSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== "full") return;
    listBlueprints()
      .then((data) => setBlueprints(data.blueprints))
      .catch((err: Error) => setError(err.message));
  }, [kind]);

  function copyBlueprint(blueprintId: string) {
    setBusyId(blueprintId);
    setError(null);
    cloneBlueprint(blueprintId)
      .then((created) => navigate(`/teacher/tests/${created.id}`))
      .catch((err: Error) => {
        setError(err.message);
        setBusyId(null);
      });
  }

  return (
    <div className="space-y-6">
      {busyId ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80"
          role="status"
          aria-live="polite"
        >
          <Spinner size="lg" className="text-primary" />
          <p className="text-lg font-semibold">Creating Test</p>
        </div>
      ) : null}
      <BackLink to="/teacher/tests" />
      <h1 className="text-3xl font-bold">Create test</h1>
      {kind === "choose" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Full Syllabus Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                onClick={() => setSearchParams({ kind: "full" })}
              >
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
            onClick={() => setSearchParams({})}
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
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <Link to={`/teacher/blueprints/${blueprint.id}/paper`}>
                        View Test
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      className="bg-green-600 text-white hover:bg-green-700"
                      disabled={busyId !== null}
                      onClick={() => copyBlueprint(blueprint.id)}
                    >
                      Use Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
