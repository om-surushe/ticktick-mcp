/**
 * Time utilities for LLM-friendly date formatting and timezone handling
 */

import type { TimeContext } from '../types';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Convert ISO date to LLM-friendly time context
 */
export function toTimeContext(
  isoDate: string,
  timezone: string = 'Asia/Kolkata'
): TimeContext {
  const date = new Date(isoDate);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  return {
    iso: isoDate,
    relative: getRelativeTime(diff),
    userLocal: formatLocalTime(date, timezone),
    timestamp: date.getTime(),
  };
}

/**
 * Get human-readable relative time
 */
function getRelativeTime(diff: number): string {
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;
  
  // Less than a minute
  if (absDiff < MINUTE) {
    return isPast ? 'just now' : 'in a moment';
  }
  
  // Minutes
  if (absDiff < HOUR) {
    const mins = Math.round(absDiff / MINUTE);
    return isPast 
      ? `${mins} minute${mins > 1 ? 's' : ''} ago`
      : `in ${mins} minute${mins > 1 ? 's' : ''}`;
  }
  
  // Hours
  if (absDiff < DAY) {
    const hours = Math.round(absDiff / HOUR);
    return isPast
      ? `${hours} hour${hours > 1 ? 's' : ''} ago`
      : `in ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  // Days
  const days = Math.round(absDiff / DAY);
  if (absDiff < 7 * DAY) {
    return isPast
      ? `${days} day${days > 1 ? 's' : ''} ago`
      : `in ${days} day${days > 1 ? 's' : ''}`;
  }
  
  // Weeks
  const weeks = Math.round(absDiff / (7 * DAY));
  if (absDiff < 30 * DAY) {
    return isPast
      ? `${weeks} week${weeks > 1 ? 's' : ''} ago`
      : `in ${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  
  // Months
  const months = Math.round(absDiff / (30 * DAY));
  return isPast
    ? `${months} month${months > 1 ? 's' : ''} ago`
    : `in ${months} month${months > 1 ? 's' : ''}`;
}

/**
 * Format date in user's local timezone
 */
function formatLocalTime(date: Date, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  
  const formatted = new Intl.DateTimeFormat('en-US', options).format(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Add relative day context
  if (isSameDay(date, today, timezone)) {
    return formatted.replace(/^\w+ \d+, \d+,/, 'Today,');
  } else if (isSameDay(date, tomorrow, timezone)) {
    return formatted.replace(/^\w+ \d+, \d+,/, 'Tomorrow,');
  }
  
  return formatted;
}

/**
 * Check if two dates are the same day in a given timezone
 */
function isSameDay(date1: Date, date2: Date, timezone: string): boolean {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return fmt.format(date1) === fmt.format(date2);
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

/**
 * Check if a date is today
 */
export function isDueToday(dueDate?: string, timezone: string = 'Asia/Kolkata'): boolean {
  if (!dueDate) return false;
  return isSameDay(new Date(dueDate), new Date(), timezone);
}

/**
 * Check if a date is within 48 hours
 */
export function isDueSoon(dueDate?: string): boolean {
  if (!dueDate) return false;
  const diff = new Date(dueDate).getTime() - Date.now();
  return diff > 0 && diff < 2 * DAY;
}

/**
 * Parse flexible date input (for LLM tool calls)
 */
export function parseFlexibleDate(input: string, timezone: string = 'Asia/Kolkata'): string {
  const lower = input.toLowerCase().trim();
  const now = new Date();
  
  // Relative keywords
  if (lower === 'today' || lower === 'now') {
    return now.toISOString();
  }
  
  if (lower === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }
  
  if (lower === 'next week') {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString();
  }
  
  // Try parsing as ISO date or timestamp
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  
  throw new Error(`Unable to parse date: ${input}`);
}
