import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const SALLES = [
  "Salle A",
  "Salle B",
  "Salle C",
  "Salle D",
  "Salle E",
] as const;

export const STATUS = ["pending", "accepted", "rejected", "scheduled"] as const;

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
