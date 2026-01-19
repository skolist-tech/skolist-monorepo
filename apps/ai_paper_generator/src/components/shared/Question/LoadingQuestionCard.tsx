import { useState, useEffect } from "react";

export function LoadingQuestionCard() {
  const [dots, setDots] = useState("");
  const [timer, setTimer] = useState(30);

  // Dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) return 0; // Stop at 0
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Extension logic
  useEffect(() => {
    if (timer === 5) {
      setTimer((prev) => prev + 10);
    }
  }, [timer]);

  return (
    <div className="relative mb-4 overflow-hidden rounded-lg border bg-card p-6 shadow-sm">
      {/* Shining effect overlay */}
      <div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite linear",
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulseText {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center justify-center space-y-4 py-8">
        {/* Timer */}
        <div className="text-sm font-medium text-muted-foreground">
          ({timer} secs)
        </div>

        {/* Animated Text */}
        <div
          className="text-center font-semibold text-primary"
          style={{ animation: "pulseText 2s ease-in-out infinite" }}
        >
          We are creating quality questions please wait {dots}
        </div>
      </div>
    </div>
  );
}
