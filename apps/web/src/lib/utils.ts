import { type ClassValue, clsx } from 'clsx';

/**
 * Utility function to merge class names
 * This is commonly used in shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
