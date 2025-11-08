import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { UponorPlatform } from '../platform';
import { MANUFACTURER } from '../devices/const';
import { UponorDevice, UponorDeviceState } from '../devices/UponorDevice';
import BigNumber from 'bignumber.js';

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

  if (currentTemp !== undefined && !isNaN(currentTemp)) {
    service.setCharacteristic(platform.Characteristic.CurrentTemperature, currentTemp);
  }

  if (targetTemp !== undefined && !isNaN(targetTemp)) {
    service.setCharacteristic(platform.Characteristic.TargetTemperature, targetTemp);
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

  if (humidity !== undefined && !isNaN(humidity)) {
    service.setCharacteristic(platform.Characteristic.CurrentRelativeHumidity, humidity);
  }

  if (accessory.context.name) {
    service.setCharacteristic(platform.Characteristic.Name, accessory.context.name);
  }

  // Setup characteristic handlers
  service
    .getCharacteristic(platform.Characteristic.CurrentHeatingCoolingState)
    .onGet(async (): Promise<CharacteristicValue> => {
      try {
        const state: UponorDeviceState = await platform.uponorProxy.getCurrentHeatingCoolingState(
          accessory.context.code
        );
        accessory.context.currentHvacMode = state;
        return toCurrentHeatingCoolingState(platform, state);
      } catch (error) {
        platform.log.error('Error getting current heating cooling state:', error);
        // Return cached value or default
        return toCurrentHeatingCoolingState(platform, accessory.context.currentHvacMode);
      }
    });

  service
    .getCharacteristic(platform.Characteristic.CurrentTemperature)
    .onGet(async (): Promise<CharacteristicValue> => {
      try {
        const currentTemperature: BigNumber = await platform.uponorProxy.getCurrentTemperature(
          accessory.context.code
        );
        const tempValue = currentTemperature.toNumber();

        // Validate the temperature value
        if (isNaN(tempValue) || !isFinite(tempValue)) {
          platform.log.warn('Invalid current temperature received, using cached value');
          return accessory.context.currentTemperature?.toNumber() || 20; // Default to 20°C
        }

        accessory.context.currentTemperature = currentTemperature;
        accessory.context.isOn = await platform.uponorProxy.isOn(accessory.context.code);
        return tempValue;
      } catch (error) {
        platform.log.error('Error getting current temperature:', error);
        // Return cached value or default
        return accessory.context.currentTemperature?.toNumber() || 20;
      }
    });

  service
    .getCharacteristic(platform.Characteristic.CurrentRelativeHumidity)
    .onGet(async (): Promise<CharacteristicValue> => {
      try {
        const currentHumidity: BigNumber = await platform.uponorProxy.getHumidity(
          accessory.context.code
        );
        const humidityValue = currentHumidity.toNumber();

        // Validate the humidity value
        if (isNaN(humidityValue) || !isFinite(humidityValue)) {
          platform.log.warn('Invalid humidity received, using cached value');
          return accessory.context.currentHumidity?.toNumber() || 50; // Default to 50%
        }

        accessory.context.currentHumidity = currentHumidity;
        return humidityValue;
      } catch (error) {
        platform.log.error('Error getting humidity:', error);
        // Return cached value or default
        return accessory.context.currentHumidity?.toNumber() || 50;
      }
    });

  service
    .getCharacteristic(platform.Characteristic.TargetTemperature)
    .onGet(async (): Promise<CharacteristicValue> => {
      try {
        const targetTemperature: BigNumber = await platform.uponorProxy.getTargetTemperature(
          accessory.context.code
        );
        const tempValue = targetTemperature.toNumber();

        // Validate the temperature value
        if (isNaN(tempValue) || !isFinite(tempValue)) {
          platform.log.warn('Invalid target temperature received, using cached value');
          return accessory.context.targetTemperature?.toNumber() || 21; // Default to 21°C
        }

        accessory.context.targetTemperature = targetTemperature;
        return tempValue;
      } catch (error) {
        platform.log.error('Error getting target temperature:', error);
        // Return cached value or default
        return accessory.context.targetTemperature?.toNumber() || 21;
      }
    })
    .onSet(async (value: CharacteristicValue): Promise<void> => {
      try {
        const targetTemperature: BigNumber = BigNumber(value as number);
        await platform.uponorProxy.setTargetTemperature(accessory.context.code, targetTemperature);
        accessory.context.targetTemperature = targetTemperature;
      } catch (error) {
        platform.log.error('Error setting target temperature:', error);
        throw error;
      }
    });

  service
    .getCharacteristic(platform.Characteristic.Name)
    .onGet(async (): Promise<CharacteristicValue> => {
      try {
        const name: string = await platform.uponorProxy.getName(accessory.context.code);

        // Validate the name
        if (!name || name === 'undefined') {
          platform.log.warn('Invalid name received, using cached value');
          return accessory.context.name || 'Uponor Thermostat';
        }

        accessory.context.name = name;
        return name;
      } catch (error) {
        platform.log.error('Error getting name:', error);
        // Return cached value or default
        return accessory.context.name || 'Uponor Thermostat';
      }
    });
};
