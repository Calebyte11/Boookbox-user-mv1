/**
 * Utility functions for converting between birthday object and date string formats
 */

export type BirthdayObject = {
  day: number;
  month:
    | "jan"
    | "feb"
    | "mar"
    | "apr"
    | "may"
    | "jun"
    | "jul"
    | "aug"
    | "sep"
    | "oct"
    | "nov"
    | "dec"; // Lowercase abbreviated month
  year: number;
};

/**
 * Converts a birthday object to a date string in YYYY-MM-DD format
 * @param birthday - The birthday object with day and month
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export const convertBirthdayToDateString = (birthday?: {
  day?: number;
  month?: string;
  year?: number;
}): string => {
  if (!birthday?.day || !birthday?.month) {
    return "";
  }

  const monthMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  const monthNum = monthMap[birthday.month.toLowerCase()];
  if (!monthNum) return "";

  const day = birthday.day.toString().padStart(2, "0");

  // Use provided year or current year as fallback
  const year = birthday.year || new Date().getFullYear();
  return `${year}-${monthNum}-${day}`;
};

/**
 * Converts a date string (YYYY-MM-DD format) to a birthday object
 * @param dateString - The date string in YYYY-MM-DD format
 * @returns Birthday object with day and month or undefined if invalid
 */
export const convertDateStringToBirthday = (
  dateString: string
): BirthdayObject | undefined => {
  if (!dateString) return undefined;

  const date = new Date(dateString);
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ] as const;
  return {
    day: date.getDate(),
    month: monthNames[date.getMonth()], // getMonth() returns 0-11, perfect for array index
    year: date.getFullYear(),
  };
};
