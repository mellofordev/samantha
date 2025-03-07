import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full bg-transparent border-0 outline-none text-lg text-white px-3 py-1 placeholder:text-white/50 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 shadow-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
