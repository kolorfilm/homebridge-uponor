import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { UponorPlatform } from '../platform';
import { UponorCoolingMode } from '../devices/UponorCoolingMode';
import { MANUFACTURER } from '../devices/const';
import { UponorDevice } from '../devices/UponorDevice';
import { adjustThermostatTemperature } from './AccessoryHelpers';

export const createUponorCoolingSwitchAccessory = (
  platform: UponorPlatform,
  accessory: PlatformAccessory<UponorCoolingMode>,
  thermostatAccessories: PlatformAccessory<UponorDevice>[]
): void => {
  // Setup accessory information
  accessory
    .getService(platform.Service.AccessoryInformation)!
    .setCharacteristic(platform.Characteristic.Manufacturer, MANUFACTURER)
    .setCharacteristic(platform.Characteristic.Model, accessory.context.model);

  // Get or create switch service
  const service: Service =
    accessory.getService(platform.Service.Switch) || accessory.addService(platform.Service.Switch);

  // Set initial characteristics
  service.setCharacteristic(platform.Characteristic.On, accessory.context.isCoolingEnabled);
  service.setCharacteristic(platform.Characteristic.Name, 'Cold mode');

  // Setup characteristic handlers
  // Handler returns cached value that is updated by background polling
  service
    .getCharacteristic(platform.Characteristic.On)
    .onGet((): boolean => {
      return accessory.context.isCoolingEnabled;
    })
    .onSet(async (value: CharacteristicValue): Promise<void> => {
      const isCoolingEnabled: boolean = value as boolean;
      platform.log.info(`[Cold mode] ${isCoolingEnabled ? 'Enabling' : 'Disabling'} cooling mode`);

      // Adjust all thermostats' temperatures if needed
      for (const thermostatAccessory of thermostatAccessories) {
        await adjustThermostatTemperature(platform, thermostatAccessory, isCoolingEnabled);
      }

      await platform.uponorProxy.setCoolingMode(isCoolingEnabled);
      accessory.context.isCoolingEnabled = isCoolingEnabled;
      platform.log.info(
        `[Cold mode] Successfully ${isCoolingEnabled ? 'enabled' : 'disabled'} cooling mode`
      );
    });
};
