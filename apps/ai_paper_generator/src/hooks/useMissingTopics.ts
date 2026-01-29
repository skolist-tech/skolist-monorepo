import { useEffect, useState } from "react";
import { getSupabaseClient } from "@skolist/auth";
import { useActivityContext } from "../context/ActivityContext";
import { useQuestionsContext } from "../context/QuestionsContext";

export interface Topic {
  id: string;
  name: string;
}

export function useMissingTopics() {
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

  return {
    missingTopics,
    isLoading,
    isLocked,
  };
}
