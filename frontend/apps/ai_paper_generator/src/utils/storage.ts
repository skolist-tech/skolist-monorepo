const STORAGE_KEY = "skolist_qpg_activities";
const CURRENT_ACTIVITY_KEY = "skolist_qpg_current_activity";

interface StoredActivity {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  userId: string;
  metadata: {
    questionCount: number;
    generatedCount: number;
    draftedCount: number;
  };
}

export const storage = {
  getActivities: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const activities = JSON.parse(stored) as StoredActivity[];
      // Convert date strings back to Date objects
      return activities.map((activity) => ({
        ...activity,
        createdAt: new Date(activity.createdAt),
        updatedAt: new Date(activity.updatedAt),
        lastOpenedAt: new Date(activity.lastOpenedAt),
      }));
    } catch (error) {
      console.error("Failed to load activities from localStorage:", error);
      return [];
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveActivities: (activities: any[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error("Failed to save activities to localStorage:", error);
    }
  },

  getCurrentActivityId: () => {
    try {
      return localStorage.getItem(CURRENT_ACTIVITY_KEY);
    } catch (error) {
      console.error(
        "Failed to load current activity from localStorage:",
        error
      );
      return null;
    }
  },

  saveCurrentActivityId: (id: string | null) => {
    try {
      if (id) {
        localStorage.setItem(CURRENT_ACTIVITY_KEY, id);
      } else {
        localStorage.removeItem(CURRENT_ACTIVITY_KEY);
      }
    } catch (error) {
      console.error("Failed to save current activity to localStorage:", error);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_ACTIVITY_KEY);
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  },
};
