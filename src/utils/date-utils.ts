// filepath: c:\Users\Bieefilled\Documents\Clients docs\bookbox\bookbox-pwa\src\utils\date-utils.ts
import { format, parseISO } from 'date-fns';

/**
 * Formats a date string into a more readable format.
 * @param dateString - The date string to format.
 * @param dateFormat - The format to use for the output date.
 * @returns The formatted date string.
 */
export const formatDate = (dateString: string, dateFormat: string = 'MMMM dd, yyyy'): string => {
    const date = parseISO(dateString);
    return format(date, dateFormat);
};

/**
 * Calculates the difference in days between two dates.
 * @param startDate - The start date.
 * @param endDate - The end date.
 * @returns The difference in days.
 */
export const differenceInDays = (startDate: Date, endDate: Date): number => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Checks if a given date is in the past.
 * @param date - The date to check.
 * @returns True if the date is in the past, false otherwise.
 */
export const isDateInPast = (date: Date): boolean => {
    return date < new Date();
};