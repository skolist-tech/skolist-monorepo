import { Card } from "@skolist/ui";
import { AlertTriangle, BookX, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useActivityContext } from "../../context/ActivityContext";
import { useQuestionsContext } from "../../context/QuestionsContext";
import { getSupabaseClient } from "@skolist/auth";

interface Topic {
  id: string;
  name: string;
}

export function MissingTopicsSection() {
  const { currentActivity } = useActivityContext();
  const { questions } = useQuestionsContext();
  const [missingTopics, setMissingTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if draft is empty (no questions in draft)
  const draftQuestionsCount = questions.filter((q) => q.is_in_draft).length;
  const isLocked = draftQuestionsCount === 0;

  useEffect(() => {
    async function fetchMissingTopics() {
      if (!currentActivity?.id) {
        setMissingTopics([]);
        return;
      }

      try {
        setIsLoading(true);
        const client = getSupabaseClient();

        // 1. Fetch all concepts for this activity from concepts_activities_maps
        const { data: conceptMaps, error: conceptMapsError } = await client
          .from("concepts_activities_maps")
          .select("concept_id")
          .eq("activity_id", currentActivity.id);

        if (conceptMapsError) {
          console.error("Error fetching concept maps:", conceptMapsError);
          return;
        }

        if (!conceptMaps || conceptMaps.length === 0) {
          setMissingTopics([]);
          return;
        }

        const conceptIds = conceptMaps.map((cm) => cm.concept_id);

        // 2. Fetch concepts with their topic_id
        const { data: concepts, error: conceptsError } = await client
          .from("concepts")
          .select("id, topic_id, topics(id, name)")
          .in("id", conceptIds);

        if (conceptsError) {
          console.error("Error fetching concepts:", conceptsError);
          return;
        }

        if (!concepts || concepts.length === 0) {
          setMissingTopics([]);
          return;
        }

        // 3. Get all unique topics from activity concepts
        const activityTopicsMap = new Map<string, Topic>();
        concepts.forEach((concept) => {
          const topic = concept.topics as any;
          if (topic && topic.id && topic.name) {
            activityTopicsMap.set(topic.id, {
              id: topic.id,
              name: topic.name,
            });
          }
        });

        // 4. Get concepts that are in draft questions
        const draftQuestions = questions.filter((q) => q.is_in_draft);
        const draftConceptIds = new Set(
          draftQuestions.flatMap((q) => q.concepts?.map((c) => c.id) || [])
        );

        // 5. Get topics covered in draft
        const coveredTopicIds = new Set<string>();
        concepts.forEach((concept) => {
          if (draftConceptIds.has(concept.id)) {
            const topic = concept.topics as any;
            if (topic && topic.id) {
              coveredTopicIds.add(topic.id);
            }
          }
        });

        // 6. Filter to get missing topics
        const missing: Topic[] = [];
        activityTopicsMap.forEach((topic) => {
          if (!coveredTopicIds.has(topic.id)) {
            missing.push(topic);
          }
        });

        // Sort alphabetically
        missing.sort((a, b) => a.name.localeCompare(b.name));

        setMissingTopics(missing);
      } catch (err) {
        console.error("Error calculating missing topics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMissingTopics();
  }, [currentActivity?.id, questions]);

  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-0 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-0 shadow-lg">
      {/* Decorative background elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rose-100/50 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-orange-100/50 blur-xl" />

      {/* Header */}
      <div className="relative flex items-center gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-500/10 to-orange-500/10 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-md">
          <BookX className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Missing Topics
          </h3>
          <p className="text-xs text-gray-500">Topics not yet covered</p>
        </div>
        <AlertTriangle className="ml-auto h-4 w-4 text-orange-400" />
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto px-5 py-4">
        {isLocked ? (
          <>
            {/* Blur overlay */}
            <div className="absolute inset-0 z-10 rounded-lg backdrop-blur-[2px]" />

            {/* Lock icon and message */}
            <div className="relative z-20 flex h-full items-center justify-center">
              <div className="text-center">
                <Lock
                  className="mx-auto h-8 w-8 text-gray-600"
                  strokeWidth={2}
                />
                <p className="mt-2 px-2 text-sm font-medium text-gray-500">
                  Missing topics will be shown once draft is created
                </p>
              </div>
            </div>
          </>
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : missingTopics.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-xl">✓</span>
            </div>
            <p className="text-sm font-medium text-green-600">
              All topics covered!
            </p>
            <p className="text-xs text-gray-500">Great job on your paper</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {missingTopics.map((topic) => (
              <li
                key={topic.id}
                className="group flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-all duration-200 hover:border-rose-100 hover:bg-rose-50/50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-400 to-orange-400 shadow-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="text-sm font-medium">{topic.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
