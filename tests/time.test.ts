/**
 * Tests for time utilities
 */

import { describe, test, expect } from 'bun:test';
import {
  toTimeContext,
  isOverdue,
  isDueToday,
  isDueSoon,
  parseFlexibleDate,
} from '../src/utils/time';

describe('Time Utilities', () => {
  describe('toTimeContext', () => {
    test('should convert ISO date to time context', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const context = toTimeContext(futureDate);

      expect(context.iso).toBe(futureDate);
      expect(context.relative).toMatch(/in \d+ hour/);
      expect(context.timestamp).toBeGreaterThan(Date.now());
    });

    test('should handle past dates', () => {
      const pastDate = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const context = toTimeContext(pastDate);

      expect(context.relative).toMatch(/\d+ hour.* ago/);
      expect(context.timestamp).toBeLessThan(Date.now());
    });
  });

  describe('isOverdue', () => {
    test('should return true for past dates', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      expect(isOverdue(pastDate)).toBe(true);
    });

    test('should return false for future dates', () => {
      const futureDate = new Date(Date.now() + 1000).toISOString();
      expect(isOverdue(futureDate)).toBe(false);
    });

    test('should return false for undefined', () => {
      expect(isOverdue(undefined)).toBe(false);
    });
  });

  describe('isDueSoon', () => {
    test('should return true for dates within 48 hours', () => {
      const soonDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(isDueSoon(soonDate)).toBe(true);
    });

    test('should return false for dates beyond 48 hours', () => {
      const laterDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(isDueSoon(laterDate)).toBe(false);
    });

    test('should return false for past dates', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      expect(isDueSoon(pastDate)).toBe(false);
    });
  });

  describe('parseFlexibleDate', () => {
    test('should parse "today"', () => {
      const result = parseFlexibleDate('today');
      const parsed = new Date(result);
      expect(parsed.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    });

    test('should parse "tomorrow"', () => {
      const result = parseFlexibleDate('tomorrow');
      const parsed = new Date(result);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Should be within same day
      expect(parsed.getDate()).toBe(tomorrow.getDate());
    });

    test('should parse ISO dates', () => {
      const isoDate = '2026-12-25T10:00:00Z';
      const result = parseFlexibleDate(isoDate);
      expect(result).toBe(new Date(isoDate).toISOString());
    });

    test('should throw on invalid input', () => {
      expect(() => parseFlexibleDate('invalid date')).toThrow();
    });
  });
});
