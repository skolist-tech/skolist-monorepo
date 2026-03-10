import { useState, useEffect } from "react";
import { Button } from "@skolist/ui";
import { Input } from "@skolist/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@skolist/ui";

import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { useCallback } from "react";

import { GeneratedQuestionCard } from "../components/shared/Question/GeneratedQuestionCard";
import { ActionReviewModal } from "../components/bank/ActionReviewModal";
import { bankService } from "../services/bankService";
import type { BankFilter, BankQuestionResponse } from "../services/bankService";
import type { GeneratedQuestionWithConcepts } from "../services/questionService";
import { VersionStateProvider } from "../context/VersionStateContext";

// Basic options - In a real app these might come from a metadata API
const HARDNESS_LEVELS = ["Easy", "Medium", "Hard"];
const QUESTION_TYPES = [
  { value: "mcq", label: "MCQ" },
  { value: "msq", label: "MSQ" },
  { value: "subjective", label: "Subjective" },
  { value: "match_the_following", label: "Match the Following" },
];

export const BankManagementPage = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<BankQuestionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [chapters, setChapters] = useState<
    { id: string; name: string; subject_id: string }[]
  >([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<BankFilter>({});

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOriginal, setReviewOriginal] =
    useState<GeneratedQuestionWithConcepts | null>(null);
  const [reviewNew, setReviewNew] =
    useState<GeneratedQuestionWithConcepts | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Fetch Data
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bankService.listQuestions(page, pageSize, {
        ...filters,
        search_query: searchQuery,
      });
      setQuestions(res.data);
      setTotal(res.total);
    } catch (error) {
      // Error handled by service or toaster
      Sentry.captureException(error);
      toast.error("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, searchQuery]);

  const fetchSubjects = async () => {
    try {
      const data = await bankService.fetchSubjects();
      setSubjects(data);
    } catch (e) {
      Sentry.captureException(e);
      console.error("Failed to fetch subjects");
    }
  };

  const fetchChapters = useCallback(async (subjectId?: string) => {
    try {
      const data = await bankService.fetchChapters(subjectId);
      setChapters(data);
    } catch (e) {
      Sentry.captureException(e);
      console.error("Failed to fetch chapters");
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    // Fetch chapters when subject filter changes
    fetchChapters(filters.subject_id);
    // Reset chapter filter when subject changes
    if (filters.chapter_id) {
      setFilters((prev) => ({ ...prev, chapter_id: undefined }));
    }
  }, [filters.subject_id, filters.chapter_id, fetchChapters]);

  useEffect(() => {
    fetchQuestions();
  }, [page, filters, fetchQuestions]); // searchQuery is triggered manually or debounce (manual for now)

  // Handlers
  const handleSearch = () => {
    setPage(1);
    fetchQuestions();
  };

  const handleFilterChange = (key: keyof BankFilter, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
    setPage(1);
  };

  // Action Handlers
  const handleAutoCorrect = async (q: BankQuestionResponse) => {
    setReviewTitle("Auto Correct Review");
    setReviewLoading(true); // temporary loading state before modal opens? or just use toast
    const toastId = toast.loading("Running Auto-Correct...");

    try {
      const res = await bankService.previewAutoCorrect(q.question);

      setReviewOriginal(res.original);
      setReviewNew(res.new);
      setReviewModalOpen(true);
      toast.dismiss(toastId);
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Auto-correct failed", { id: toastId });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRegenerate = async (q: BankQuestionResponse, prompt?: string) => {
    setReviewTitle("Regenerate Review");
    const toastId = toast.loading("Regenerating...");

    try {
      const res = await bankService.previewRegenerate(q.question, prompt);

      setReviewOriginal(res.original);
      setReviewNew(res.new);
      setReviewModalOpen(true);
      toast.dismiss(toastId);
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Regenerate failed", { id: toastId });
    }
  };

  const handleConfirmUpdate = async () => {
    if (!reviewNew || !reviewOriginal) return;

    setReviewLoading(true);
    try {
      await bankService.updateQuestion(reviewOriginal.id, reviewNew);
      toast.success("Question updated successfully");
      setReviewModalOpen(false);
      fetchQuestions(); // Refresh list
    } catch (error) {
      Sentry.captureException(error);
      toast.error("Failed to update question");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleResolveImage = async (id: string) => {
    try {
      await bankService.removeImageNeeded(id);
      toast.success("Image flag resolved");
      // Update local state to remove flag without full refresh
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id
            ? { ...q, raw_data: { ...q.raw_data, is_image_needed: false } }
            : q
        )
      );
    } catch (e) {
      Sentry.captureException(e);
      toast.error("Failed to resolve image flag");
    }
  };

  const handleResolveIncomplete = async (id: string) => {
    try {
      await bankService.removeIncomplete(id);
      toast.success("Question marked as complete");
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id
            ? { ...q, raw_data: { ...q.raw_data, is_incomplete: false } }
            : q
        )
      );
    } catch (e) {
      Sentry.captureException(e);
      toast.error("Failed to resolve incomplete flag");
    }
  };

  return (
    <VersionStateProvider>
      <div className="flex h-screen w-full flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h1 className="text-xl font-bold">Bank Management</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchQuestions}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Filters */}
          <div className="flex w-64 flex-col gap-4 overflow-y-auto border-r bg-muted/10 p-4">
            <h2 className="text-sm font-semibold">Filters</h2>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Subject</label>
              <Select
                value={filters.subject_id || "all"}
                onValueChange={(v) => handleFilterChange("subject_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Chapter</label>
              <Select
                value={filters.chapter_id || "all"}
                onValueChange={(v) => handleFilterChange("chapter_id", v)}
                disabled={!filters.subject_id}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      filters.subject_id
                        ? "All Chapters"
                        : "Select Subject First"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chapters</SelectItem>
                  {chapters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Question Type</label>
              <Select
                value={filters.question_type || "all"}
                onValueChange={(v) => handleFilterChange("question_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Difficulty</label>
              <Select
                value={filters.hardness_level || "all"}
                onValueChange={(v) => handleFilterChange("hardness_level", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {HARDNESS_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Source</label>
              <Select
                value={
                  filters.is_solved_example === true
                    ? "solved"
                    : filters.is_from_exercise === true
                      ? "exercise"
                      : "all"
                }
                onValueChange={(v) => {
                  if (v === "solved") {
                    setFilters((p) => ({
                      ...p,
                      is_solved_example: true,
                      is_from_exercise: undefined,
                    }));
                  } else if (v === "exercise") {
                    setFilters((p) => ({
                      ...p,
                      is_solved_example: undefined,
                      is_from_exercise: true,
                    }));
                  } else {
                    setFilters((p) => ({
                      ...p,
                      is_solved_example: undefined,
                      is_from_exercise: undefined,
                    }));
                  }
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="solved">Solved Examples</SelectItem>
                  <SelectItem value="exercise">Exercise Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Image Needed?</label>
              <Select
                value={
                  filters.is_image_needed === true
                    ? "yes"
                    : filters.is_image_needed === false
                      ? "no"
                      : "all"
                }
                onValueChange={(v) => {
                  const val =
                    v === "yes" ? true : v === "no" ? false : undefined;
                  handleFilterChange("is_image_needed", val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Is Incomplete?</label>
              <Select
                value={
                  filters.is_incomplete === true
                    ? "yes"
                    : filters.is_incomplete === false
                      ? "no"
                      : "all"
                }
                onValueChange={(v) => {
                  const val =
                    v === "yes" ? true : v === "no" ? false : undefined;
                  handleFilterChange("is_incomplete", val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Incomplete Only</SelectItem>
                  <SelectItem value="no">Complete Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="flex gap-2 border-b p-4">
              <div className="relative max-w-lg flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search question text..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
              {loading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading
                  questions...
                </div>
              ) : questions.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No questions found.
                </div>
              ) : (
                <div className="mx-auto flex max-w-4xl flex-col gap-6">
                  <div className="mb-2 text-xs text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} -{" "}
                    {Math.min(page * pageSize, total)} of {total} results
                  </div>
                  {questions.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex flex-col gap-2"
                    >
                      {/* Resolution Toolbar */}
                      {(item.raw_data.is_image_needed ||
                        item.raw_data.is_incomplete) && (
                        <div className="flex justify-end gap-2">
                          {item.raw_data.is_image_needed && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                              onClick={() => handleResolveImage(item.id)}
                            >
                              <ImagePlus className="h-3.5 w-3.5" />
                              Resolve Image
                            </Button>
                          )}
                          {item.raw_data.is_incomplete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleResolveIncomplete(item.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      )}
                      <GeneratedQuestionCard
                        question={
                          item.question as GeneratedQuestionWithConcepts
                        }
                        onMoveToDraft={() => {}}
                        // Map Handlers to Bank Logic
                        onAutoCorrect={async () => {
                          await handleAutoCorrect(item);
                        }}
                        // GeneratedQuestionCard's onRegenerate expects (prompt, files, isCamera)
                        onRegenerate={(prompt) =>
                          handleRegenerate(item, prompt)
                        }
                        // onUpdate is for manual save.
                        // If Card allows manual edit, it passes updated payload.
                        // signature: onUpdate: (updatedQuestion) => void
                        onUpdate={(updatedQuestion) => {
                          // For manual edit, we also want review?
                          // The user said "same applied for all kind of actions"
                          setReviewTitle("Manual Edit Review");
                          setReviewOriginal(
                            item.question as GeneratedQuestionWithConcepts
                          );
                          setReviewNew(
                            updatedQuestion as GeneratedQuestionWithConcepts
                          );
                          setReviewModalOpen(true);
                        }}
                        onDelete={async () => {}} // Not implementing delete for now?
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t bg-white p-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / pageSize) || 1}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {reviewOriginal && reviewNew && (
          <ActionReviewModal
            isOpen={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
            onConfirm={handleConfirmUpdate}
            title={reviewTitle}
            originalData={reviewOriginal}
            newData={reviewNew}
            isLoading={reviewLoading}
          />
        )}
      </div>
    </VersionStateProvider>
  );
};

export default BankManagementPage;
