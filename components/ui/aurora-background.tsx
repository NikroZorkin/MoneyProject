"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen items-center justify-start text-white transition-all",
        className
      )}
      style={{
        background: `
          radial-gradient(1200px 600px at 80% 10%, rgba(184, 245, 1, 0.08), transparent 60%),
          radial-gradient(1000px 500px at 20% 80%, rgba(255, 255, 255, 0.04), transparent 60%),
          linear-gradient(160deg, #0a2818, #1a3d2b)
        `,
      }}
      {...props}
    >
      {/* Aurora layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            `absolute -inset-[10px] opacity-40 will-change-transform`,
            `[--lime-glow:repeating-linear-gradient(100deg,rgba(184,245,1,0.15)_10%,rgba(196,255,13,0.08)_15%,rgba(234,255,122,0.05)_20%,rgba(184,245,1,0.12)_25%,rgba(196,255,13,0.1)_30%)]`,
            `[--dark-gradient:repeating-linear-gradient(100deg,rgba(10,40,24,0.8)_0%,rgba(10,40,24,0.6)_7%,transparent_10%,transparent_12%,rgba(26,61,43,0.7)_16%)]`,
            `[background-image:var(--dark-gradient),var(--lime-glow)]`,
            `[background-size:300%,_200%]`,
            `[background-position:50%_50%,50%_50%]`,
            `blur-[10px]`,
            `after:content-[""] after:absolute after:inset-0`,
            `after:[background-image:var(--dark-gradient),var(--lime-glow)]`,
            `after:[background-size:200%,_100%]`,
            `after:animate-aurora after:[background-attachment:fixed] after:mix-blend-screen`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
          )}
        />
      </div>

      {/* Floating light orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-lime-400/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-emerald-500/8 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[50%] right-[30%] w-[200px] h-[200px] rounded-full bg-lime-300/6 blur-[60px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};
