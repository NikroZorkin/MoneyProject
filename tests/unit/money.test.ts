// @ts-nocheck
import { formatMoney, parseMoney, roundHalfUp } from '@/lib/money';

describe('Money utilities', () => {
  describe('formatMoney', () => {
    it('should format EUR correctly', () => {
      expect(formatMoney(12345, 'EUR', 'en-US')).toBe('€123.45');
      expect(formatMoney(-5000, 'EUR', 'en-US')).toBe('-€50.00');
    });

    it('should format USD correctly', () => {
      expect(formatMoney(10000, 'USD', 'en-US')).toBe('$100.00');
    });
  });

  describe('parseMoney', () => {
    it('should parse decimal amounts', () => {
      expect(parseMoney('123.45')).toBe(12345);
      expect(parseMoney('50,00')).toBe(5000);
      expect(parseMoney('-25.50')).toBe(-2550);
    });

    it('should handle invalid input', () => {
      expect(parseMoney('abc')).toBe(0);
      expect(parseMoney('')).toBe(0);
    });
  });

  describe('roundHalfUp', () => {
    it('should round correctly', () => {
      expect(roundHalfUp(123.4)).toBe(123);
      expect(roundHalfUp(123.5)).toBe(124);
      expect(roundHalfUp(123.6)).toBe(124);
    });
  });
});

