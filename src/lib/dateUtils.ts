/**
 * Simple date utility functions to avoid date-fns dependency conflicts
 */

export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  let result: string;

  if (diffYears > 0) {
    result = `${diffYears} year${diffYears !== 1 ? 's' : ''}`;
  } else if (diffMonths > 0) {
    result = `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
  } else if (diffWeeks > 0) {
    result = `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`;
  } else if (diffDays > 0) {
    result = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    result = `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    result = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  } else {
    result = 'just now';
  }

  if (options?.addSuffix && result !== 'just now') {
    if (diffMs < 0) {
      result = `in ${result}`;
    } else {
      result = `${result} ago`;
    }
  }

  return result;
}