import { RefreshCw } from "lucide-react";

export function RegenerateOverlay({
  isRegenerateReturning,
  regenerateOrigin,
}: {
  isRegenerateReturning: boolean;
  regenerateOrigin: { top: number; right: number };
}) {
  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden rounded-lg"
      style={
        {
          "--regen-origin-top": `${regenerateOrigin.top}px`,
          "--regen-origin-right": `${regenerateOrigin.right}px`,
        } as React.CSSProperties
      }
    >
      {!isRegenerateReturning && (
        <div
          className="absolute left-1/2 z-20 -translate-x-1/2 text-center"
          style={{
            top: "calc(50% + 40px)",
            animation: "delayedFadeIn 0.3s ease-out 0.8s forwards",
            opacity: 0,
          }}
        >
          <span className="text-lg font-bold text-foreground">
            Regenerating
          </span>
          <span className="text-lg font-bold text-foreground after:inline-block after:min-w-[1.5em] after:animate-[dots_2s_infinite_steps(1)] after:text-left after:content-['']" />
        </div>
      )}
      <div
        className="absolute inset-0 bg-background/60"
        style={{
          animation: isRegenerateReturning
            ? "regenBlurFadeOut 0.8s ease-out forwards"
            : "regenBlurPulse 2s ease-in-out 0.8s infinite",
        }}
      />
      <div
        className="absolute z-10"
        style={{
          top: `${regenerateOrigin.top}px`,
          right: `${regenerateOrigin.right}px`,
          animation: isRegenerateReturning
            ? "regenReturn 0.8s ease-in forwards"
            : "regenTrajectory 0.8s ease-out forwards",
        }}
      >
        <div
          style={{
            animation: isRegenerateReturning
              ? "none"
              : "regenSpin 1s linear 0.8s infinite",
          }}
        >
          <RefreshCw
            className="text-primary drop-shadow-lg"
            style={{
              width: isRegenerateReturning ? "64px" : "16px",
              height: isRegenerateReturning ? "64px" : "16px",
              filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))",
              animation: isRegenerateReturning
                ? "regenShrink 0.8s ease-in forwards"
                : "regenGrow 0.8s ease-out forwards",
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes regenTrajectory {
          0% {
            top: var(--regen-origin-top);
            right: var(--regen-origin-right);
            transform: translate(0, 0);
          }
          30% {
            transform: translate(-20%, 50%);
          }
          60% {
            transform: translate(-35%, 70%);
          }
          100% {
            top: 50%;
            right: 50%;
            transform: translate(50%, -50%);
          }
        }
        @keyframes regenReturn {
          0% {
            top: 50%;
            right: 50%;
            transform: translate(50%, -50%);
          }
          40% {
            transform: translate(35%, -70%);
          }
          70% {
            transform: translate(20%, -50%);
          }
          100% {
            top: var(--regen-origin-top);
            right: var(--regen-origin-right);
            transform: translate(0, 0);
          }
        }
        @keyframes regenGrow {
          0% { width: 16px; height: 16px; }
          100% { width: 64px; height: 64px; }
        }
        @keyframes regenShrink {
          0% { width: 64px; height: 64px; }
          100% { width: 16px; height: 16px; }
        }
        @keyframes regenSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes regenBlurPulse {
          0%, 100% { backdrop-filter: blur(2px); background-color: rgba(255, 255, 255, 0.4); }
          50% { backdrop-filter: blur(8px); background-color: rgba(255, 255, 255, 0.7); }
        }
        @keyframes regenBlurFadeOut {
          0% { backdrop-filter: blur(8px); background-color: rgba(255, 255, 255, 0.7); }
          100% { backdrop-filter: blur(0px); background-color: rgba(255, 255, 255, 0); }
        }
        @keyframes delayedFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
        }
      `}</style>
    </div>
  );
}
