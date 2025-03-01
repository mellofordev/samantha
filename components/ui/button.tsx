import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-t border-t-[rgba(255,255,255,0.32)] border-l-0 border-r-0 border-b-0 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(150,150,150,0.2)] text-white border-0 border-t border-[rgba(255,255,255,0.32)] border-solid backdrop-blur-[24px] hover:bg-[rgba(75,75,75,0.9)]",
        destructive:
          "bg-destructive/90 text-destructive-foreground shadow-sm hover:bg-destructive/80",
        outline:
          "bg-background/90 shadow-sm hover:bg-accent/90 hover:text-accent-foreground",
        secondary:
          "bg-[rgba(50,50,50,0.9)] text-white shadow-sm hover:bg-[rgba(75,75,75,1)] border border-[rgba(255,255,255,0.2)]",
        ghost: "hover:bg-accent/90 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
