import { useEffect, useState } from "react";

function remainingSeconds(
  startedAt: string | null | undefined,
  durationMinutes: number
) {
  if (!startedAt) return durationMinutes * 60;
  const start = new Date(startedAt).getTime();
  const end = start + durationMinutes * 60 * 1000;
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
}

function format(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function Timer({
  startedAt,
  durationMinutes,
  onExpire,
}: {
  startedAt?: string | null;
  durationMinutes: number;
  onExpire?: () => void;
}) {
  const [seconds, setSeconds] = useState(() =>
    remainingSeconds(startedAt, durationMinutes)
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = remainingSeconds(startedAt, durationMinutes);
      setSeconds(next);
      if (next <= 0) {
        window.clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, durationMinutes, onExpire]);

  return <div className="font-mono text-lg">{format(seconds)}</div>;
}
