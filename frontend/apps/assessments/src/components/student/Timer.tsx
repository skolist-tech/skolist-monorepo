import { useEffect, useState } from "react";

function formatRemaining(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

type Props = {
  startedAt?: string | null;
  durationMinutes: number;
  onExpire: () => void;
};

export function Timer({ startedAt, durationMinutes, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() => durationMinutes * 60);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const startMs = startedAt ? Date.parse(startedAt) : Date.now();
    const endMs = startMs + durationMinutes * 60_000;

    const tick = () => {
      const next = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0 && !expired) {
        setExpired(true);
        onExpire();
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, durationMinutes, onExpire, expired]);

  const urgent = remaining <= 10 * 60;

  return (
    <div
      className={`rounded border px-3 py-1 font-mono text-lg font-bold tracking-wider ${
        urgent
          ? "border-red-500 bg-red-50 text-red-700"
          : "border-slate-400 bg-white text-slate-900"
      }`}
      title="Time Left"
    >
      {formatRemaining(remaining)}
    </div>
  );
}
