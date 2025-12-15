import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50",
  {
    variants: {
      variant: {
        // Lime gradient primary
        default: 
          "bg-gradient-to-r from-lime-500 to-lime-400 text-[#0a2818] font-semibold shadow-lg shadow-lime-500/25 hover:shadow-lime-500/40 hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-red-500/80 text-white hover:bg-red-500 shadow-lg shadow-red-500/20",
        // Glass outline
        outline:
          "border border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/30",
        // Glass secondary
        secondary:
          "bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/15",
        // Ghost with subtle hover
        ghost:
          "text-white/70 hover:text-white hover:bg-white/5",
        // Lime link
        link: "text-lime-400 underline-offset-4 hover:underline hover:text-lime-300",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
