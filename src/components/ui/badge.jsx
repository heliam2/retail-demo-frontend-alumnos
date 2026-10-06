import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-body text-label-md font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        promo: "bg-[#CCFBF1] text-[#115E59]",
        new: "bg-muted text-muted-foreground",
        success: "bg-[#DCFCE7] text-[#166534]",
        warning: "bg-[#FFEDD5] text-[#9A3412]",
        danger: "bg-[#FEE2E2] text-[#991B1B]",
        outline: "border border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
