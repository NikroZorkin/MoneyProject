"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-lime-400" />,
        info: <InfoIcon className="size-4 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 text-yellow-400" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-lime-400" />,
      }}
      toastOptions={{
        classNames: {
          toast: "glass-card !bg-[rgba(26,61,43,0.95)] !border-white/20 !backdrop-blur-xl",
          title: "!text-white",
          description: "!text-white/60",
          actionButton: "!bg-lime-500 !text-[#0a2818]",
          cancelButton: "!bg-white/10 !text-white",
        },
      }}
      style={
        {
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
