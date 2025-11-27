/**
 * Timezone utilities for consistent time handling across the BoookBox app
 * 
 * The core principle: Selected times should remain consistent regardless of user's timezone.
 * A booking for "2:00 PM" should always show as "2:00 PM" for all users.
 */

// Default restaurant timezone (can be made configurable per restaurant later)
const DEFAULT_RESTAURANT_TIMEZONE = 'Africa/Lagos'; // Nigeria timezone for most restaurants

/**
 * Get the user's current timezone
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Get the restaurant's timezone (defaulting to Nigeria timezone)
 * In the future, this could be fetched from restaurant data
 */
export const getRestaurantTimezone = (): string => {
  // TODO: In the future, fetch from restaurant data
  // For now, assume all restaurants are in Nigeria timezone
  return DEFAULT_RESTAURANT_TIMEZONE;
};

/**
 * Create a timezone-aware datetime that represents the "restaurant local time"
 * This ensures that "2:00 PM" selected by the user is treated as 2:00 PM at the restaurant
 * 
 * SIMPLIFIED APPROACH: Create the datetime as if it's in UTC, but treat it as restaurant local time
 * This avoids complex timezone calculations while maintaining consistency
 * 
 * @param date - The selected date
 * @param timeString - Time in "HH:MM" format (24-hour)
 * @returns ISO string that represents the time consistently across timezones
 */
export const createRestaurantLocalDateTime = (
  date: Date, 
  timeString: string
): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Create a new date object from the input date
  const restaurantDateTime = new Date(date);
  
  // Set the time in UTC (this preserves the exact time across timezones)
  restaurantDateTime.setUTCFullYear(date.getFullYear());
  restaurantDateTime.setUTCMonth(date.getMonth());
  restaurantDateTime.setUTCDate(date.getDate());
  restaurantDateTime.setUTCHours(hours, minutes, 0, 0);
  
  return restaurantDateTime.toISOString();
};

/**
 * Format a date/time for display, maintaining consistency across timezones
 * Always shows the time as it was stored (treats stored UTC time as the intended time)
 * 
 * @param isoString - ISO date string from the API
 * @param options - Formatting options
 * @returns Formatted date/time string
 */
export const formatConsistentDateTime = (
  isoString: string,
  options: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    showTime?: boolean;
  } = {}
): string => {
  const {
    dateStyle = 'medium',
    timeStyle = 'short',
    showTime = true
  } = options;

  const date = new Date(isoString);
  
  if (!showTime) {
    // For date-only display, use UTC to avoid timezone shifting
    return date.toLocaleDateString('en-US', { 
      dateStyle,
      timeZone: 'UTC'
    });
  }
  
  // For datetime display, show the stored time as-is (treating UTC as local time)
  return date.toLocaleString('en-US', {
    dateStyle,
    timeStyle,
    timeZone: 'UTC' // This preserves the exact stored time
  });
};

/**
 * Extract time string (HH:MM) from an ISO date string
 * This ensures the displayed time matches what was originally selected
 */
export const extractStoredTime = (isoString: string): string => {
  const date = new Date(isoString);
  
  // Extract hours and minutes from UTC (preserves original selection)
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * Check if a given time is in the past
 * Compares the stored time with current time in a consistent manner
 */
export const isTimeInPast = (isoString: string): boolean => {
  const selectedTime = new Date(isoString);
  const now = new Date();
  
  return selectedTime < now;
};

/**
 * Generate time slots for a time picker
 * This ensures consistent time slots regardless of user's timezone
 */
export const generateTimeSlots = (
  startHour: number = 9,
  endHour: number = 22,
  intervalMinutes: number = 30
): Array<{ value: string; label: string }> => {
  const slots: Array<{ value: string; label: string }> = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Format for display (12-hour format)
      const displayTime = new Date(`2000-01-01T${timeValue}:00`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      slots.push({
        value: timeValue,
        label: displayTime
      });
    }
  }
  
  return slots;
};

/**
 * Validate that a selected time is within business hours
 */
export const isWithinBusinessHours = (
  timeString: string,
  businessHours: { open: string; close: string } = { open: '09:00', close: '22:00' }
): boolean => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const selectedMinutes = hours * 60 + minutes;
  
  const [openHours, openMins] = businessHours.open.split(':').map(Number);
  const openMinutes = openHours * 60 + openMins;
  
  const [closeHours, closeMins] = businessHours.close.split(':').map(Number);
  const closeMinutes = closeHours * 60 + closeMins;
  
  return selectedMinutes >= openMinutes && selectedMinutes <= closeMinutes;
};