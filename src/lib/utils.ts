import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A robust function to convert various date formats into a JavaScript Date object.
 * It gracefully handles Firestore Timestamps, ISO strings, epoch numbers, and existing Date objects.
 * @param date The date value to convert, which can be of any type.
 * @returns {Date | null} A valid Date object or null if the conversion fails.
 */
export const toDate = (date: any): Date | null => {
    if (!date) return null;

    // If it's already a valid Date object, return it.
    if (date instanceof Date) {
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    // Handle Firestore Timestamp objects
    if (typeof date.toDate === 'function') {
        try {
            return date.toDate();
        } catch (e) {
            return null;
        }
    }
    
    // Handle ISO strings or epoch numbers
    if (typeof date === 'string' || typeof date === 'number') {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
            return d;
        }
    }

    return null;
};
