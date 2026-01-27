import { Sparkles } from "lucide-react";

export function AutoCorrectOverlay({
  isReturning,
  sparkleOrigin,
}: {
  isReturning: boolean;
  sparkleOrigin: { top: number; right: number };
}) {
  return (
    <div
      data-html2canvas-ignore
      className="absolute inset-0 z-50 overflow-hidden rounded-lg"
      style={
        {
          "--origin-top": `${sparkleOrigin.top}px`,
          "--origin-right": `${sparkleOrigin.right}px`,
        } as React.CSSProperties
      }
    >
      {!isReturning && (
        <div
          className="absolute left-1/2 z-20 -translate-x-1/2 text-center"
          style={{
            top: "calc(50% + 40px)",
            animation: "delayedFadeIn 0.3s ease-out 0.8s forwards",
            opacity: 0,
          }}
        >
          <span className="text-lg font-bold text-foreground">
            We are correcting
          </span>
          <span className="text-lg font-bold text-foreground after:inline-block after:min-w-[1.5em] after:animate-[dots_2s_infinite_steps(1)] after:text-left after:content-['']" />
        </div>
      )}
      <div
        className="absolute inset-0 bg-background/60"
        style={{
          animation: isReturning
            ? "blurFadeOut 0.8s ease-out forwards"
            : "blurPulse 2s ease-in-out infinite",
          animationDelay: isReturning ? "0s" : "0.8s",
        }}
      />
      <div
        className="absolute z-10"
        style={{
          top: `${sparkleOrigin.top}px`,
          right: `${sparkleOrigin.right}px`,
          animation: isReturning
            ? "sparkleReturn 0.8s ease-in forwards"
            : "sparkleTrajectory 0.8s ease-out forwards",
        }}
      >
        <div
          style={{
            animation: isReturning
              ? "none"
              : "sparklePulse 1.5s ease-in-out infinite",
            animationDelay: "0.8s",
          }}
        >
          <Sparkles
            className="text-yellow-400 drop-shadow-lg"
            style={{
              width: isReturning ? "64px" : "20px",
              height: isReturning ? "64px" : "20px",
              filter: "drop-shadow(0 0 10px rgba(250, 204, 21, 0.5))",
              animation: isReturning
                ? "sparkleShrink 0.8s ease-in forwards"
                : "sparkleGrow 0.8s ease-out forwards",
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes sparkleTrajectory {
          0% {
            top: var(--origin-top);
            right: var(--origin-right);
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
        @keyframes sparkleReturn {
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
            top: var(--origin-top);
            right: var(--origin-right);
            transform: translate(0, 0);
          }
        }
        @keyframes sparkleGrow {
          0% { width: 20px; height: 20px; }
          100% { width: 64px; height: 64px; }
        }
        @keyframes sparkleShrink {
          0% { width: 64px; height: 64px; }
          100% { width: 20px; height: 20px; }
        }
        @keyframes sparklePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.25); opacity: 1; filter: drop-shadow(0 0 20px rgba(250, 204, 21, 0.8)); }
        }
        @keyframes blurPulse {
          0%, 100% { backdrop-filter: blur(2px); background-color: rgba(255, 255, 255, 0.4); }
          50% { backdrop-filter: blur(8px); background-color: rgba(255, 255, 255, 0.7); }
        }
        @keyframes blurFadeOut {
          0% { backdrop-filter: blur(8px); background-color: rgba(255, 255, 255, 0.7); }
          100% { backdrop-filter: blur(0px); background-color: rgba(255, 255, 255, 0); }
        }
        @keyframes dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
        }
        @keyframes delayedFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}