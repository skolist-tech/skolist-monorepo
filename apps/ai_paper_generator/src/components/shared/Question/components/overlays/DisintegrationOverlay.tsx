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