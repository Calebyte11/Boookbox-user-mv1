/**
 * Returns a human-readable string representing the time difference between now and the given date.
 * @param date The date to compare with the current time.
 * @returns A string like "Just now", "5 minutes ago", "2 hours ago", or "3 days ago".
 */
export function diffInSeconds(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) {
        return "now";
    }
    if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `${minutes}min${minutes !== 1 ? "s" : ""} ago`;
    }
    if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours}hr${hours !== 1 ? "s" : ""} ago`;
    }

    const secondsPerDay = 86400;
    const secondsPerWeek = 7 * secondsPerDay;
    const secondsPerMonth = 30 * secondsPerDay; // approximate month

    if (diff < secondsPerWeek) {
        const days = Math.floor(diff / secondsPerDay);
        return `${days}dy${days !== 1 ? "s" : ""} ago`;
    }
    if (diff < secondsPerMonth) {
        const weeks = Math.floor(diff / secondsPerWeek);
        return `${weeks}wk${weeks !== 1 ? "s" : ""} ago`;
    }

    const months = Math.floor(diff / secondsPerMonth);
    return `${months}mo${months !== 1 ? "s" : ""} ago`;
}

/**
 * Checks if an item was edited by comparing createdAt and updatedAt timestamps
 * @param createdAt The original creation date
 * @param updatedAt The last update date
 * @returns true if the item was edited (updatedAt is significantly later than createdAt)
 */
export function wasEdited(createdAt: string, updatedAt: string): boolean {
    const created = new Date(createdAt).getTime();
    const updated = new Date(updatedAt).getTime();
    // Consider edited if updated more than 5 seconds after creation (to account for server processing time)
    return updated - created > 5000;
}


/**
 * Returns a timestamp with an optional "edited" indicator
 * @param date The date to format
 * @param isEdited Whether the item was edited
 * @returns A formatted string like "3hrs" or "3hrs • Edited"
 */
export function formatTimestampWithEdit(date: Date, isEdited: boolean): string {
    const timeString = diffInSeconds(date);
    return isEdited ? `${timeString} • Edited` : timeString;
}