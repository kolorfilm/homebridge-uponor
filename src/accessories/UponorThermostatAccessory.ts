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
  service.getCharacteristic(platform.Characteristic.CurrentTemperature).setProps({
    minValue: accessory.context.minLimitTemperature.toNumber(),
    maxValue: accessory.context.maxLimitTemperature.toNumber(),
  });
  service.setCharacteristic(
    platform.Characteristic.CurrentTemperature,
    accessory.context.currentTemperature.toNumber()
  );
  service.getCharacteristic(platform.Characteristic.TargetTemperature).setProps({
    minValue: accessory.context.minLimitTemperature.toNumber(),
    maxValue: accessory.context.maxLimitTemperature.toNumber(),
    minStep: 0.5,
  });
  service.setCharacteristic(
    platform.Characteristic.TargetTemperature,
    accessory.context.targetTemperature.toNumber()
  );
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
  service.setCharacteristic(
    platform.Characteristic.CurrentRelativeHumidity,
    accessory.context.currentHumidity.toNumber()
  );

  service.setCharacteristic(platform.Characteristic.Name, accessory.context.name);

  // Setup characteristic handlers
  service
    .getCharacteristic(platform.Characteristic.CurrentHeatingCoolingState)
    .onGet(async (): Promise<CharacteristicValue> => {
      const state: UponorDeviceState = await platform.uponorProxy.getCurrentHeatingCoolingState(
        accessory.context.code
      );
      accessory.context.currentHvacMode = state;
      return toCurrentHeatingCoolingState(platform, state);
    });

  service
    .getCharacteristic(platform.Characteristic.CurrentTemperature)
    .onGet(async (): Promise<CharacteristicValue> => {
      const currentTemperature: BigNumber = await platform.uponorProxy.getCurrentTemperature(
        accessory.context.code
      );
      accessory.context.currentTemperature = currentTemperature;
      accessory.context.isOn = await platform.uponorProxy.isOn(accessory.context.code);
      return currentTemperature.toNumber();
    });

  service
    .getCharacteristic(platform.Characteristic.CurrentRelativeHumidity)
    .onGet(async (): Promise<CharacteristicValue> => {
      const currentHumidity: BigNumber = await platform.uponorProxy.getHumidity(
        accessory.context.code
      );
      accessory.context.currentHumidity = currentHumidity;
      return currentHumidity.toNumber();
    });

  service
    .getCharacteristic(platform.Characteristic.TargetTemperature)
    .onGet(async (): Promise<CharacteristicValue> => {
      const targetTemperature: BigNumber = await platform.uponorProxy.getTargetTemperature(
        accessory.context.code
      );
      accessory.context.targetTemperature = targetTemperature;
      return targetTemperature.toNumber();
    })
    .onSet(async (value: CharacteristicValue): Promise<void> => {
      const targetTemperature: BigNumber = BigNumber(value as number);
      await platform.uponorProxy.setTargetTemperature(accessory.context.code, targetTemperature);
      accessory.context.targetTemperature = targetTemperature;
    });

  service
    .getCharacteristic(platform.Characteristic.Name)
    .onGet(async (): Promise<CharacteristicValue> => {
      const name: string = await platform.uponorProxy.getName(accessory.context.code);
      accessory.context.name = name;
      return name;
    });
};
