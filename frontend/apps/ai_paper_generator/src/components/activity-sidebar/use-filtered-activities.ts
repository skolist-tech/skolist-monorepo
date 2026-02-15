import { useState, useMemo } from "react";
import type { Activity } from "@skolist/db";

export function useFilteredActivities(activities: Activity[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredActivities = useMemo(() => {
    return activities
      .filter((activity) =>
        activity.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
  }, [activities, searchQuery, sortOrder]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return {
    searchQuery,
    setSearchQuery,
    sortOrder,
    toggleSort,
    filteredActivities,
  };
}
