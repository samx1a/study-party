import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge class names; later Tailwind classes win over earlier ones ("p-6" + "p-0" → "p-0").
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
