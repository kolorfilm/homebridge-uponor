import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { UponorPlatform } from '../platform';
import { MANUFACTURER } from '../devices/const';
import { UponorDevice, UponorDeviceState } from '../devices/UponorDevice';
import BigNumber from 'bignumber.js';
import {
  createCachedGetter,
  isValidNumber,
  isValidString,
  isValueInBounds,
} from './AccessoryHelpers';

const toCurrentHeatingCoolingState = (
  platform: UponorPlatform,
  state: UponorDeviceState
): number => {
  switch (state) {
    case UponorDeviceState.HEATING:
      return platform.Characteristic.CurrentHeatingCoolingState.HEAT;
    case UponorDeviceState.COOLING:
      return platform.Characteristic.CurrentHeatingCoolingState.COOL;
    default:
      return platform.Characteristic.CurrentHeatingCoolingState.OFF;
  }
};

export const createUponorThermostatAccessory = (
  platform: UponorPlatform,
  accessory: PlatformAccessory<UponorDevice>
): void => {
  // Setup accessory information
  accessory
    .getService(platform.Service.AccessoryInformation)!
    .setCharacteristic(platform.Characteristic.Manufacturer, MANUFACTURER)
    .setCharacteristic(platform.Characteristic.Model, accessory.context.model)
    .setCharacteristic(platform.Characteristic.SerialNumber, accessory.context.code);

  // Get or create thermostat service
  const service: Service =
    accessory.getService(platform.Service.Thermostat) ||
    accessory.addService(platform.Service.Thermostat);

  // Set initial characteristics
  service.setCharacteristic(
    platform.Characteristic.CurrentHeatingCoolingState,
    toCurrentHeatingCoolingState(platform, accessory.context.currentHvacMode)
  );
  service.setCharacteristic(
    platform.Characteristic.TargetHeatingCoolingState,
    platform.Characteristic.TargetHeatingCoolingState.AUTO
  );

  // Validate and set temperature values
  const minTemp = accessory.context.minLimitTemperature?.toNumber();
  const maxTemp = accessory.context.maxLimitTemperature?.toNumber();
  const currentTemp = accessory.context.currentTemperature?.toNumber();
  const targetTemp = accessory.context.targetTemperature?.toNumber();
  const humidity = accessory.context.currentHumidity?.toNumber();
  const deviceName = accessory.context.name || accessory.context.code;

  // Set temperature props if min/max are valid
  if (minTemp !== undefined && !isNaN(minTemp) && maxTemp !== undefined && !isNaN(maxTemp)) {
    service.getCharacteristic(platform.Characteristic.CurrentTemperature).setProps({
      minValue: minTemp,
      maxValue: maxTemp,
    });
    service.getCharacteristic(platform.Characteristic.TargetTemperature).setProps({
      minValue: minTemp,
      maxValue: maxTemp,
      minStep: 0.5,
    });
  }

  // Set current temperature only if within valid bounds
  if (isValueInBounds(currentTemp, minTemp, maxTemp)) {
    service.setCharacteristic(platform.Characteristic.CurrentTemperature, currentTemp!);
  } else if (currentTemp !== undefined && !isNaN(currentTemp)) {
    platform.log.warn(
      `[${deviceName}] Ignoring invalid current temperature: ${currentTemp}°C (valid range: ${minTemp}-${maxTemp}°C)`
    );
  }

  // Set target temperature only if within valid bounds
  if (isValueInBounds(targetTemp, minTemp, maxTemp)) {
    service.setCharacteristic(platform.Characteristic.TargetTemperature, targetTemp!);
  } else if (targetTemp !== undefined && !isNaN(targetTemp)) {
    platform.log.warn(
      `[${deviceName}] Ignoring invalid target temperature: ${targetTemp}°C (valid range: ${minTemp}-${maxTemp}°C)`
    );
  }

  service.setCharacteristic(
    platform.Characteristic.TemperatureDisplayUnits,
    platform.config.displayUnit === 'CELSIUS'
      ? platform.Characteristic.TemperatureDisplayUnits.CELSIUS
      : platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT
  );

  service.getCharacteristic(platform.Characteristic.CurrentRelativeHumidity).setProps({
    minValue: 0,
    maxValue: 100,
  });

  // Set humidity only if within valid bounds
  if (isValueInBounds(humidity, 0, 100)) {
    service.setCharacteristic(platform.Characteristic.CurrentRelativeHumidity, humidity!);
  } else if (humidity !== undefined && !isNaN(humidity)) {
    platform.log.warn(
      `[${deviceName}] Ignoring invalid humidity: ${humidity}% (valid range: 0-100%)`
    );
  }

  if (accessory.context.name) {
    service.setCharacteristic(platform.Characteristic.Name, accessory.context.name);
  }

  // Setup characteristic handlers
  // All handlers return cached values that are updated by background polling
  service
    .getCharacteristic(platform.Characteristic.CurrentHeatingCoolingState)
    .onGet((): CharacteristicValue => {
      return toCurrentHeatingCoolingState(platform, accessory.context.currentHvacMode);
    });

  service.getCharacteristic(platform.Characteristic.CurrentTemperature).onGet(
    createCachedGetter(
      () => accessory.context.currentTemperature?.toNumber(),
      20, // Default to 20°C
      isValidNumber
    )
  );

  service.getCharacteristic(platform.Characteristic.CurrentRelativeHumidity).onGet(
    createCachedGetter(
      () => accessory.context.currentHumidity?.toNumber(),
      50, // Default to 50%
      isValidNumber
    )
  );

  service
    .getCharacteristic(platform.Characteristic.TargetTemperature)
    .onGet(
      createCachedGetter(
        () => accessory.context.targetTemperature?.toNumber(),
        21, // Default to 21°C
        isValidNumber
      )
    )
    .onSet(async (value: CharacteristicValue): Promise<void> => {
      try {
        const targetTemperature: BigNumber = BigNumber(value as number);
        platform.log.info(
          `[${deviceName}] Setting target temperature to ${targetTemperature.toNumber()}°C`
        );
        await platform.uponorProxy.setTargetTemperature(accessory.context.code, targetTemperature);
        accessory.context.targetTemperature = targetTemperature;
        platform.log.info(
          `[${deviceName}] Successfully set target temperature to ${targetTemperature.toNumber()}°C`
        );
      } catch (error) {
        platform.log.error(`[${deviceName}] Error setting target temperature:`, error);
        throw error;
      }
    });

  service
    .getCharacteristic(platform.Characteristic.Name)
    .onGet(createCachedGetter(() => accessory.context.name, 'Uponor Thermostat', isValidString));
};
