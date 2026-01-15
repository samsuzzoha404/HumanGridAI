import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 min-h-[44px] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl hover:shadow-destructive/20",
        outline: "border-2 border-border bg-transparent hover:bg-muted hover:text-foreground hover:border-border/80 hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-lg hover:shadow-xl hover:shadow-secondary/20",
        ghost: "hover:bg-muted/60 hover:text-foreground hover:shadow-sm transition-all",
        link: "text-primary underline-offset-4 hover:underline hover:opacity-80",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-xl hover:shadow-2xl hover:shadow-success/35 transition-all",
        gradient: "bg-gradient-to-r from-primary via-secondary to-primary bg-200% animate-gradient-x text-foreground hover:opacity-95 shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all",
        glass: "glass-card bg-muted/50 hover:bg-muted/70 border-0 hover:shadow-xl transition-all",
        accept: "bg-success text-success-foreground hover:bg-success/90 shadow-xl hover:shadow-2xl hover:shadow-success/40 font-bold transition-all",
        skip: "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border-2 border-border/60 hover:border-border transition-all",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-sm",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-13 px-7 text-base",
        xl: "h-14 px-8 text-lg font-bold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
