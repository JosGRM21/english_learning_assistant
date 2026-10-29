import dayjs from 'dayjs';

/**
 * Returns the local date string in YYYY-MM-DD format based on local time.
 * Avoids any timezone shift bugs associated with UTC/ISO string conversions.
 */
export function getLocalDateString(date: Date = new Date()): string {
  return dayjs(date).format('YYYY-MM-DD');
}
