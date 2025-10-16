import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Button as ChakraButton } from "@chakra-ui/react";
import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<ChakraButtonProps, "size" | "variant">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Map shadcn variants to Chakra UI props
    const getChakraVariant = () => {
      switch (variant) {
        case "outline":
          return "outline";
        case "ghost":
          return "ghost";
        case "link":
          return "link";
        default:
          return "solid";
      }
    };

    const getChakraSize = () => {
      switch (size) {
        case "sm":
          return "sm";
        case "lg":
          return "lg";
        case "icon":
          return "sm";
        default:
          return "md";
      }
    };

    const getChakraColorScheme = () => {
      if (variant === "destructive") return "red";
      if (variant === "secondary") return "gray";
      return "blue"; // Use academic.accent color
    };

    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref}>
          {children}
        </Slot>
      );
    }

    return (
      <ChakraButton
        ref={ref}
        variant={getChakraVariant()}
        size={getChakraSize()}
        colorScheme={getChakraColorScheme()}
        bg={variant === "default" ? "academic.accent" : undefined}
        color={variant === "default" ? "white" : undefined}
        borderColor={variant === "outline" ? "academic.border" : undefined}
        _hover={{
          bg: variant === "default" ? "#506580" : variant === "outline" ? "academic.paper" : undefined,
          borderColor: variant === "outline" ? "academic.accent" : undefined,
        }}
        className={className}
        {...props}
      >
        {children}
      </ChakraButton>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
