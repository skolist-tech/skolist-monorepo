import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@skolist/ui";
import { fastApiService } from "../services/fastApiService";
import { useQuestionsContext } from "./QuestionsContext";

export type ExtractionJobStatus = "processing" | "success" | "failure";

export interface ExtractionJob {
  jobId: string;
  sectionId: string;
  status: ExtractionJobStatus;
}

interface ExtractionJobsContextValue {
  jobs: ExtractionJob[];
  processingSectionIds: Set<string>;
  startExtractionJob: (job: { jobId: string; sectionId: string }) => void;
}

const ExtractionJobsContext = createContext<
  ExtractionJobsContextValue | undefined
>(undefined);

const POLL_INTERVAL_MS = 5000;

export function ExtractionJobsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { refetchQuestions } = useQuestionsContext();
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
  const handledJobIds = useRef(new Set<string>());

  const startExtractionJob = useCallback(
    (job: { jobId: string; sectionId: string }) => {
      setJobs((prev) => {
        if (prev.some((existing) => existing.jobId === job.jobId)) {
          return prev;
        }
        return [
          ...prev,
          { jobId: job.jobId, sectionId: job.sectionId, status: "processing" },
        ];
      });
    },
    []
  );

  useEffect(() => {
    const processingJobs = jobs.filter((job) => job.status === "processing");
    if (processingJobs.length === 0) return;

    let cancelled = false;

    const poll = async () => {
      await Promise.all(
        processingJobs.map(async (job) => {
          if (handledJobIds.current.has(job.jobId)) return;
          try {
            const result = await fastApiService.getExtractQuestionsStatus(
              job.jobId
            );
            if (cancelled) return;
            if (result.status === "processing") return;

            handledJobIds.current.add(job.jobId);
            setJobs((prev) =>
              prev.map((existing) =>
                existing.jobId === job.jobId
                  ? {
                      ...existing,
                      status: result.status as ExtractionJobStatus,
                    }
                  : existing
              )
            );

            if (result.status === "success") {
              await refetchQuestions();
              toast({
                title: "Questions Extracted Successfully",
                description:
                  result.questions_extracted != null
                    ? `${result.questions_extracted} question(s) added to the section.`
                    : undefined,
              });
            } else if (result.status === "failure") {
              toast({
                title: "Question extraction failed",
                description:
                  result.error_message ||
                  "Something went wrong while extracting questions.",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error("Failed to poll extract job status:", error);
          }
        })
      );
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [jobs, refetchQuestions, toast]);

  const processingSectionIds = useMemo(
    () =>
      new Set(
        jobs
          .filter((job) => job.status === "processing")
          .map((job) => job.sectionId)
      ),
    [jobs]
  );

  const value = useMemo(
    () => ({
      jobs,
      processingSectionIds,
      startExtractionJob,
    }),
    [jobs, processingSectionIds, startExtractionJob]
  );

  return (
    <ExtractionJobsContext.Provider value={value}>
      {children}
    </ExtractionJobsContext.Provider>
  );
}

export function useExtractionJobs() {
  const context = useContext(ExtractionJobsContext);
  if (context === undefined) {
    throw new Error(
      "useExtractionJobs must be used within an ExtractionJobsProvider"
    );
  }
  return context;
}
