import { FileQuestion } from "lucide-react";
import { subjectIcons } from "./thumbnail";

/**
 * Returns the appropriate icon for an activity based on its name
 */
export const getActivityIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  for (const [key, Icon] of Object.entries(subjectIcons)) {
    if (lowerName.includes(key.toLowerCase())) {
      return Icon;
    }
  }
  return FileQuestion;
};
