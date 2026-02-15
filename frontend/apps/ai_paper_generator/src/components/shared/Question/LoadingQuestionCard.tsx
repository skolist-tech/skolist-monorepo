import { useState, useEffect } from "react";

export function LoadingQuestionCard() {
  const [dots, setDots] = useState(0);
  const [timer, setTimer] = useState(30);
  const [timerExtended, setTimerExtended] = useState(false);

  // Dots animation (0, 1, 2, 3, 0, ...)
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev >= 3 ? 0 : prev + 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Extension logic with animation trigger
  useEffect(() => {
    if (timer === 5) {
      setTimerExtended(true);
      setTimer((prev) => prev + 10);
      // Reset the animation flag after animation completes
      setTimeout(() => setTimerExtended(false), 500);
    }
  }, [timer]);

  // Calculate progress for circular timer (0-100)
  const maxTime = 30;
  const progress = Math.min((timer / maxTime) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Render dots with fixed width - show full dots only
  const renderDots = () => {
    return (
      <span className="inline-flex w-[24px] justify-start">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block w-[8px] text-center"
            style={{
              opacity: i < dots ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          >
            .
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="relative mb-4 overflow-hidden rounded-lg border bg-card p-8 shadow-lg">
      {/* Animated gradient background - Navy blue theme */}
      <div
        className="absolute inset-0 z-0 opacity-30"
        style={{
          background:
            "linear-gradient(135deg, rgba(30,58,138,0.15) 0%, rgba(59,130,246,0.1) 50%, rgba(30,58,138,0.15) 100%)",
        }}
      />

      {/* Enhanced shimmer effect */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 80%)",
          backgroundSize: "300% 100%",
          animation: "shimmer 2.5s infinite ease-in-out",
        }}
      />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes timerPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes ringGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(30,58,138,0.4)); }
          50% { filter: drop-shadow(0 0 8px rgba(59,130,246,0.6)); }
        }
      `}</style>

      <div
        className="relative z-10 flex flex-col items-center justify-center space-y-6 py-4"
        style={{ animation: "float 3s ease-in-out infinite" }}
      >
        {/* Circular Timer */}
        <div className="relative">
          <svg
            width="100"
            height="100"
            className="drop-shadow-lg"
            style={{ animation: "ringGlow 2s ease-in-out infinite" }}
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted/20"
            />
            {/* Progress circle with gradient - Navy blue theme */}
            <defs>
              <linearGradient
                id="timerGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                transition: "stroke-dashoffset 1s linear",
              }}
            />
          </svg>
          {/* Timer text in center */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              animation: timerExtended ? "timerPop 0.5s ease-out" : "none",
            }}
          >
            <span
              className="text-2xl font-bold"
              style={{
                background:
                  "linear-gradient(135deg, #1e3a8a, #3b82f6, #1e3a8a)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "gradientShift 3s ease infinite",
              }}
            >
              {timer}s
            </span>
          </div>
        </div>

        {/* Animated Text - Navy blue theme */}
        <div className="text-center">
          <span
            className="text-lg font-semibold"
            style={{
              background:
                "linear-gradient(90deg, #1e3a8a, #3b82f6, #1e3a8a, #3b82f6)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "gradientShift 4s ease infinite",
            }}
          >
            We are creating quality questions, please wait{renderDots()}
          </span>
        </div>
      </div>
    </div>
  );
}
