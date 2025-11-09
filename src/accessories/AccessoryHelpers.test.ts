import BigNumber from 'bignumber.js';
import {
  createCachedGetter,
  isValidNumber,
  isValidString,
  bigNumberToNumber,
  isValueInBounds,
} from './AccessoryHelpers';

describe('AccessoryHelpers', () => {
  describe('createCachedGetter', () => {
    it('should return value when defined', () => {
      const getter = createCachedGetter(() => 42, 0);

      expect(getter()).toBe(42);
    });

    it('should return default value when undefined', () => {
      const getter = createCachedGetter(() => undefined, 99);

      expect(getter()).toBe(99);
    });

    it('should return default value when validation fails', () => {
      const getter = createCachedGetter(
        () => -1,
        0,
        (val) => val >= 0
      );

      expect(getter()).toBe(0);
    });

    it('should return value when validation passes', () => {
      const getter = createCachedGetter(
        () => 50,
        0,
        (val) => val >= 0
      );

      expect(getter()).toBe(50);
    });

    it('should work with string values', () => {
      const getter = createCachedGetter(() => 'test', 'default');

      expect(getter()).toBe('test');
    });
  });

  describe('isValidNumber', () => {
    it('should return true for zero', () => {
      expect(isValidNumber(0)).toBe(true);
    });

    it('should return true for positive numbers', () => {
      expect(isValidNumber(42)).toBe(true);
    });

    it('should return true for negative numbers', () => {
      expect(isValidNumber(-10)).toBe(true);
    });

    it('should return true for decimal numbers', () => {
      expect(isValidNumber(3.14)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isValidNumber(NaN)).toBe(false);
    });

    it('should return false for positive Infinity', () => {
      expect(isValidNumber(Infinity)).toBe(false);
    });

    it('should return false for negative Infinity', () => {
      expect(isValidNumber(-Infinity)).toBe(false);
    });
  });

  describe('isValidString', () => {
    it('should return true for simple string', () => {
      expect(isValidString('test')).toBe(true);
    });

    it('should return true for string with spaces', () => {
      expect(isValidString('Hello World')).toBe(true);
    });

    it('should return true for whitespace only', () => {
      expect(isValidString(' ')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidString('')).toBe(false);
    });

    it('should return false for "undefined" string', () => {
      expect(isValidString('undefined')).toBe(false);
    });
  });

  describe('bigNumberToNumber', () => {
    it('should convert BigNumber to number', () => {
      const bn = new BigNumber(42);

      expect(bigNumberToNumber(bn, 0)).toBe(42);
    });

    it('should return default value when undefined', () => {
      expect(bigNumberToNumber(undefined, 99)).toBe(99);
    });

    it('should handle decimal values', () => {
      const bn = new BigNumber(3.14159);

      expect(bigNumberToNumber(bn, 0)).toBeCloseTo(3.14159);
    });

    it('should return default value for invalid BigNumber', () => {
      const invalid = { toNumber: () => NaN } as unknown as BigNumber;

      expect(bigNumberToNumber(invalid, 50)).toBe(50);
    });

    it('should return default value for Infinity', () => {
      const invalid = { toNumber: () => Infinity } as unknown as BigNumber;

      expect(bigNumberToNumber(invalid, 25)).toBe(25);
    });
  });

  describe('isValueInBounds', () => {
    it('should return true for value within bounds', () => {
      expect(isValueInBounds(50, 0, 100)).toBe(true);
    });

    it('should return true for value at minimum bound', () => {
      expect(isValueInBounds(0, 0, 100)).toBe(true);
    });

    it('should return true for value at maximum bound', () => {
      expect(isValueInBounds(100, 0, 100)).toBe(true);
    });

    it('should return false for value below minimum', () => {
      expect(isValueInBounds(-1, 0, 100)).toBe(false);
    });

    it('should return false for value above maximum', () => {
      expect(isValueInBounds(101, 0, 100)).toBe(false);
    });

    it('should return false for undefined value', () => {
      expect(isValueInBounds(undefined, 0, 100)).toBe(false);
    });

    it('should return false for undefined min', () => {
      expect(isValueInBounds(50, undefined, 100)).toBe(false);
    });

    it('should return false for undefined max', () => {
      expect(isValueInBounds(50, 0, undefined)).toBe(false);
    });

    it('should return false for NaN value', () => {
      expect(isValueInBounds(NaN, 0, 100)).toBe(false);
    });

    it('should return false for NaN min', () => {
      expect(isValueInBounds(50, NaN, 100)).toBe(false);
    });

    it('should return false for NaN max', () => {
      expect(isValueInBounds(50, 0, NaN)).toBe(false);
    });
  });
});
