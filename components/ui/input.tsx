import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "h-10 w-full min-w-0 rounded-lg px-4 py-2 text-base md:text-sm",
        // Glass background
        "bg-white/[0.06] backdrop-blur-sm",
        // Glass border
        "border border-white/[0.15]",
        // Text colors
        "text-white placeholder:text-white/40",
        // File input
        "file:text-lime-400 file:bg-transparent file:border-0 file:text-sm file:font-medium",
        // Selection
        "selection:bg-lime-500/30 selection:text-white",
        // Transition
        "transition-all duration-200",
        // Focus state - lime glow
        "focus:outline-none focus:border-lime-500/50 focus:ring-2 focus:ring-lime-500/20 focus:shadow-[0_0_20px_rgba(184,245,1,0.1)]",
        // Invalid state
        "aria-invalid:border-red-500/50 aria-invalid:ring-red-500/20",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
