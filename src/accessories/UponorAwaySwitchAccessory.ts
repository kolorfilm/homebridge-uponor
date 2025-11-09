import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { UponorPlatform } from '../platform';
import { MANUFACTURER } from '../devices/const';
import { UponorDevice } from '../devices/UponorDevice';
import { UponorAwayMode } from '../devices/UponorAwayMode';
import { adjustThermostatTemperature } from './AccessoryHelpers';

export const createUponorAwaySwitchAccessory = (
  platform: UponorPlatform,
  accessory: PlatformAccessory<UponorAwayMode>,
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
  service.setCharacteristic(platform.Characteristic.On, accessory.context.isAwayEnabled);
  service.setCharacteristic(platform.Characteristic.Name, 'Vacation Mode');

  // Setup characteristic handlers
  // Handler returns cached value that is updated by background polling
  service
    .getCharacteristic(platform.Characteristic.On)
    .onGet((): boolean => {
      return accessory.context.isAwayEnabled;
    })
    .onSet(async (value: CharacteristicValue): Promise<void> => {
      const isAwayEnabled: boolean = value as boolean;
      platform.log.info(`[Vacation Mode] ${isAwayEnabled ? 'Enabling' : 'Disabling'} away mode`);

      // Adjust all thermostats' temperatures if needed
      for (const thermostatAccessory of thermostatAccessories) {
        await adjustThermostatTemperature(platform, thermostatAccessory, isAwayEnabled);
      }

      await platform.uponorProxy.setAwayMode(isAwayEnabled);
      accessory.context.isAwayEnabled = isAwayEnabled;
      platform.log.info(
        `[Vacation Mode] Successfully ${isAwayEnabled ? 'enabled' : 'disabled'} away mode`
      );
    });
};
