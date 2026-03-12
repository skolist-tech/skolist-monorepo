import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useConceptContext } from "../../context/ConceptContext";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@skolist/ui";
import { Eye, Loader2 } from "lucide-react";
import { getOnlineTestsBySubject } from "../../services/onlineTestService";

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function TestDashboardHome() {
  const {
    schoolClasses,
    subjects,
    selectSchoolClass,
    selectSubject,
    selection, // { classId, subjectId }
  } = useConceptContext();

  const [tests, setTests] = useState<any[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);

  // Fetch tests when subject changes
  useEffect(() => {
    const subjectId = selection.subjectId;
    if (!subjectId) {
      setTests([]);
      return;
    }

    const loadTests = async () => {
      setIsLoadingTests(true);
      try {
        const data = await getOnlineTestsBySubject(
          subjectId,
          selection.classId || undefined
        );
        setTests(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingTests(false);
      }
    };
    loadTests();
  }, [selection.subjectId, selection.classId]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Tests</CardTitle>
          <CardDescription>
            Select a class and subject to view available tests.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          {/* Class Selector */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Class
            </label>
            <Select
              value={selection.classId || ""}
              onValueChange={(val) => {
                selectSchoolClass(val);
                // Reset subject when class changes (handled by context usually, but ensure UI updates)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {schoolClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Selector */}
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Subject
            </label>
            <Select
              value={selection.subjectId || ""}
              onValueChange={(val) => selectSubject(val)}
              disabled={!selection.classId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tests</CardTitle>
          <CardDescription>
            {tests.length} tests found for selected subject.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTests ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {selection.subjectId
                ? "No tests found for this subject."
                : "Please select a subject to view tests."}
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-left text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                      Test Name
                    </th>
                    {/* <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th> */}
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                      Created Date
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {tests.map((test) => (
                    <tr
                      key={test.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle font-medium">
                        {test.title ||
                          test.qgen_drafts?.paper_title ||
                          "Untitled Test"}
                        <div className="text-xs font-normal text-muted-foreground">
                          Code: {test.share_code}
                        </div>
                      </td>
                      {/* <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${test.status === 'active' ? 'border-transparent bg-green-500 text-white' : 'border-transparent bg-secondary text-secondary-foreground'}`}>
                          {test.status}
                        </span>
                      </td> */}
                      <td className="p-4 align-middle">
                        {formatDate(test.created_at)}
                      </td>
                      <td className="p-4 text-right align-middle">
                        <Link to={`/test-dashboard/details/${test.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
