import Lottie from "lottie-react";
import chatAnimationData from "../../../../../public/Chat.json";

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