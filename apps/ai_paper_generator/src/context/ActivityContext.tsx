/**
 * Activity Context
 * Manages activities for the AI Paper Generator (product_type='qgen')
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@skolist/auth";
import type { Activity } from "@skolist/db";
import {
  fetchUserActivities,
  createActivity as createActivityService,
  deleteActivity as deleteActivityService,
  updateActivity as updateActivityService,
} from "../services/activityService";

interface ActivityContextValue {
  activities: Activity[];
  currentActivity: Activity | null;
  isLoading: boolean;
  error: string | null;
  createActivity: (options?: { name?: string }) => Promise<Activity | null>;
  selectActivity: (activityId: string) => void;
  deleteActivity: (activityId: string) => Promise<void>;
  renameActivity: (activityId: string, newName: string) => Promise<void>;
  refreshActivities: () => Promise<void>;
}

export const ActivityContext = createContext<ActivityContextValue | undefined>(
  undefined
);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities on mount and when user changes
  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setCurrentActivity(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchUserActivities();
      setActivities(data);

      // Auto-select first activity if none selected
      setCurrentActivity((prev) => {
        if (data.length > 0 && !prev) {
          return data[0] ?? null;
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setError("Failed to load activities");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = useCallback(
    async (options?: { name?: string }): Promise<Activity | null> => {
      try {
        let name = options?.name;
        if (!name) {
          let i = 1;
          while (activities.some((a) => a.name === `New Activity ${i}`)) {
            i++;
          }
          name = `New Activity ${i}`;
        }

        const newActivity = await createActivityService(name);
        setActivities((prev) => [newActivity, ...prev]);
        setCurrentActivity(newActivity);
        return newActivity;
      } catch (err) {
        console.error("Failed to create activity:", err);
        setError("Failed to create activity");
        return null;
      }
    },
    [activities]
  );

  const selectActivity = useCallback(
    (activityId: string) => {
      const activity = activities.find((a) => a.id === activityId);
      if (activity) {
        setCurrentActivity(activity);
      }
    },
    [activities]
  );

  const deleteActivity = useCallback(async (activityId: string) => {
    try {
      await deleteActivityService(activityId);

      // Use functional updates to avoid stale closure issues
      setActivities((prevActivities) => {
        const remaining = prevActivities.filter((a) => a.id !== activityId);

        // Also update currentActivity based on the new activities list
        setCurrentActivity((prevCurrent) => {
          // If the deleted activity was the current one, select the first remaining
          if (prevCurrent?.id === activityId) {
            return remaining[0] ?? null;
          }
          // If current activity still exists in remaining, keep it
          // Otherwise (edge case), select first remaining or null
          const stillExists = remaining.some((a) => a.id === prevCurrent?.id);
          if (stillExists) {
            return prevCurrent;
          }
          return remaining[0] ?? null;
        });

        return remaining;
      });
    } catch (err) {
      console.error("Failed to delete activity:", err);
      setError("Failed to delete activity");
      throw err;
    }
  }, []);

  const renameActivity = useCallback(
    async (activityId: string, newName: string) => {
      try {
        const updated = await updateActivityService(activityId, {
          name: newName,
        });
        setActivities((prev) =>
          prev.map((a) => (a.id === activityId ? updated : a))
        );
        if (currentActivity?.id === activityId) {
          setCurrentActivity(updated);
        }
      } catch (err) {
        console.error("Failed to rename activity:", err);
        setError("Failed to rename activity");
        throw err;
      }
    },
    [currentActivity]
  );

  const value: ActivityContextValue = {
    activities,
    currentActivity,
    isLoading,
    error,
    createActivity,
    selectActivity,
    deleteActivity,
    renameActivity,
    refreshActivities: fetchActivities,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivityContext() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error(
      "useActivityContext must be used within an ActivityProvider"
    );
  }
  return context;
}
