import BigNumber from 'bignumber.js';
import { PlatformAccessory } from 'homebridge';
import { UponorDevice } from '../devices/UponorDevice';
import { UponorPlatform } from '../platform';

/**
 * Validates if a value is within the specified bounds
 *
 * @param value - The value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns True if value is valid and within bounds
 */
export const isValueInBounds = (
  value: number | undefined,
  min: number | undefined,
  max: number | undefined
): boolean => {
  return (
    value !== undefined &&
    !isNaN(value) &&
    min !== undefined &&
    !isNaN(min) &&
    max !== undefined &&
    !isNaN(max) &&
    value >= min &&
    value <= max
  );
};

/**
 * Adjusts thermostat temperature when switching mode (away/cooling).
 * When enabling mode: If target is at min, set to max
 * When disabling mode: If target is at max, set to min
 *
 * @param platform - The Uponor platform instance
 * @param thermostatAccessory - The thermostat accessory to adjust
 * @param isModeEnabled - Whether the mode (away/cooling) is being enabled
 */
export const adjustThermostatTemperature = async (
  platform: UponorPlatform,
  thermostatAccessory: PlatformAccessory<UponorDevice>,
  isModeEnabled: boolean
): Promise<void> => {
  const { code, name } = thermostatAccessory.context;
  const deviceName = name || code;
  const targetTemperature = await platform.uponorProxy.getTargetTemperature(code);

  if (isModeEnabled) {
    const minLimit = platform.uponorProxy.getMinLimitTemperature(code);
    if (targetTemperature.isEqualTo(minLimit)) {
      const maxLimit = platform.uponorProxy.getMaxLimitTemperature(code);
      platform.log.info(
        `[${deviceName}] Adjusting temperature from ${minLimit.toNumber()}°C to ${maxLimit.toNumber()}°C`
      );
      await platform.uponorProxy.setTargetTemperature(code, maxLimit);
    }
  } else {
    const maxLimit = platform.uponorProxy.getMaxLimitTemperature(code);
    if (targetTemperature.isEqualTo(maxLimit)) {
      const minLimit = platform.uponorProxy.getMinLimitTemperature(code);
      platform.log.info(
        `[${deviceName}] Adjusting temperature from ${maxLimit.toNumber()}°C to ${minLimit.toNumber()}°C`
      );
      await platform.uponorProxy.setTargetTemperature(code, minLimit);
    }
  }
};

/**
 * Creates a cached getter function that returns values from accessory context
 * without making API calls. Values are updated by background polling.
 *
 * @param getValue - Function to retrieve the value from context
 * @param defaultValue - Default value if context value is undefined or invalid
 * @param validate - Optional validation function
 * @returns A getter function that returns cached values
 */
export const createCachedGetter = <T>(
  getValue: () => T | undefined,
  defaultValue: T,
  validate?: (value: T) => boolean
): (() => T) => {
  return (): T => {
    const value = getValue();
    if (value === undefined) {
      return defaultValue;
    }
    if (validate && !validate(value)) {
      return defaultValue;
    }
    return value;
  };
};

/**
 * Validates that a number is valid (not NaN and finite)
 */
export const isValidNumber = (value: number): boolean => !isNaN(value) && isFinite(value);

/**
 * Validates that a string is not empty or 'undefined'
 */
export const isValidString = (value: string): boolean => value !== '' && value !== 'undefined';

/**
 * Safely converts BigNumber to number with validation and fallback
 *
 * @param bigNumber - The BigNumber to convert
 * @param defaultValue - Default value if conversion fails
 * @returns The numeric value or default
 */
export const bigNumberToNumber = (
  bigNumber: BigNumber | undefined,
  defaultValue: number
): number => {
  if (!bigNumber || !bigNumber.toNumber) {
    return defaultValue;
  }
  const value = bigNumber.toNumber();
  return isValidNumber(value) ? value : defaultValue;
};
