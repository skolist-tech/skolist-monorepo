import { Sparkles, RefreshCw } from "lucide-react";
import Lottie from "lottie-react";
import chatAnimationData from "../../../../../public/Chat.json";

// --- Disintegration Animation ---

interface DisintegrationParticle {
  size: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
  xOffset: number;
  yOffset: number;
  rotation: number;
}

export function DisintegrationOverlay({
  particleData,
}: {
  particleData: DisintegrationParticle[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-visible rounded-lg">
      {particleData.map((particle, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={
            {
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              backgroundColor: `hsl(${Math.random() * 30 + 10}, 10%, ${50 + Math.random() * 30}%)`,
              opacity: 0,
              "--x-offset": `${particle.xOffset}px`,
              "--y-offset": `${particle.yOffset}px`,
              "--rotation": `${particle.rotation}deg`,
              animation: `particle-float-${i % 4} ${particle.duration}s ease-out ${particle.delay}s forwards`,
            } as React.CSSProperties
          }
        />
      ))}
      <style>{`
        @keyframes particle-float-0 {
          0% {
            opacity: 0.9;
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--x-offset), var(--y-offset)) scale(0.2) rotate(180deg);
          }
        }
        @keyframes particle-float-1 {
          0% {
            opacity: 0.85;
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
            transform: translate(var(--x-offset), var(--y-offset)) scale(0.1) rotate(-180deg);
          }
        }
        @keyframes particle-float-2 {
          0% {
            opacity: 0.9;
            transform: translate(0, 0) scale(1);
          }
          30% {
            opacity: 0.7;
            transform: translate(calc(var(--x-offset) * 0.3), calc(var(--y-offset) * 0.2)) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translate(var(--x-offset), var(--y-offset)) scale(0);
          }
        }
        @keyframes particle-float-3 {
          0% {
            opacity: 0.8;
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          60% {
            opacity: 0.4;
          }
          100% {
            opacity: 0;
            transform: translate(var(--x-offset), var(--y-offset)) scale(0.15) rotate(270deg);
          }
        }
      `}</style>
    </div>
  );
}

// --- Auto Correct Animation ---

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
            We Are correcting
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

// --- Regenerate Animation ---

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
            : "regenBlurPulse 2s ease-in-out infinite",
          animationDelay: isRegenerateReturning ? "0s" : "0.8s",
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
              : "regenSpin 1s linear infinite",
            animationDelay: "0.8s",
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
      `}</style>
    </div>
  );
}

// --- Chat Prompt Animation ---

export function ChatPromptOverlay() {
  return (
    <div className="absolute inset-0 z-50 overflow-hidden rounded-lg">
      <div
        className="absolute left-1/2 z-20 -translate-x-1/2 text-center"
        style={{
          top: "calc(50% + 40px)",
          animation: "delayedFadeIn 0.3s ease-out 0.5s forwards",
          opacity: 0,
        }}
      >
        <span className="text-lg font-bold text-foreground">
          Regenerating with prompt
        </span>
        <span className="text-lg font-bold text-foreground after:inline-block after:min-w-[1.5em] after:animate-[dots_2s_infinite_steps(1)] after:text-left after:content-['']" />
      </div>

      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        style={{
          animation: "chatBlurPulse 2s ease-in-out infinite",
        }}
      />

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div
          className="h-24 w-24"
          style={{
            animation: "lottieScaleIn 0.3s ease-out forwards",
          }}
        >
          <Lottie
            animationData={chatAnimationData}
            loop={true}
            autoplay={true}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
      <style>{`
        @keyframes chatBlurPulse {
          0%, 100% {
            backdrop-filter: blur(4px);
            background-color: rgba(255, 255, 255, 0.5);
          }
          50% {
            backdrop-filter: blur(8px);
            background-color: rgba(255, 255, 255, 0.7);
          }
        }
        @keyframes lottieScaleIn {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
