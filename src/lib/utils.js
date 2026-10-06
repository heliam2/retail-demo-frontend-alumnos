import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display-lg",
        "text-display-md",
        "text-headline-lg",
        "text-headline-md",
        "text-title-md",
        "text-price-lg",
        "text-body-lg",
        "text-body-md",
        "text-label-md",
      ],
    },
  },
});

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
