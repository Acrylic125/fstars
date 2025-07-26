import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) {
    throw "0s";
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(" ") : "0s";
}

export function formatDateTimeISO(date: Date): string {
  const isoString = date.toISOString();

  // Extract date part (yyyy-mm-dd)
  const datePart = isoString.substring(0, 10);

  // Extract time part and replace colons with underscores
  const timePart = isoString.substring(11, 19).replace(/:/g, "_");

  return `${datePart} ${timePart}`;
}
