// Helper to convert minutes number to "HH:MM:00" for Postgres time/interval
export const minsToTime = (mins: number | string): string => {
  const m = Number(mins);
  if (isNaN(m)) return "00:00:00";
  const hours = Math.floor(m / 60);
  const minutes = Math.floor(m % 60);
  // Pad with leading zeros
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${hh}:${mm}:00`;
};

// Helper to convert "HH:MM:SS" or "HH:MM" to minutes number
export const timeToMins = (timeStr: string | null): number => {
  if (!timeStr) return 0;
  // Handle "60 mins" legacy format if any
  if (timeStr.includes("mins")) {
    return parseInt(timeStr) || 0;
  }
  // Handle HH:MM:SS
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h!) || isNaN(m!)) return 0;
  return (h || 0) * 60 + (m || 0);
};
