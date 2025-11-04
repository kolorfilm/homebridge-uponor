import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { UponorPlatform } from '../platform';
import { MANUFACTURER } from '../devices/const';
import { UponorDevice } from '../devices/UponorDevice';
import BigNumber from 'bignumber.js';
import { UponorAwayMode } from '../devices/UponorAwayMode';

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
  service
    .getCharacteristic(platform.Characteristic.On)
    .onGet((): Promise<boolean> => platform.uponorProxy.isAwayEnabled())
    .onSet(async (value: CharacteristicValue): Promise<void> => {
      const isAwayEnabled: boolean = value as boolean;

      for (const thermostatAccessory of thermostatAccessories) {
        if (isAwayEnabled) {
          const targetTemperature: BigNumber = await platform.uponorProxy.getTargetTemperature(
            thermostatAccessory.context.code
          );
          const minLimitTemperature: BigNumber = platform.uponorProxy.getMinLimitTemperature(
            thermostatAccessory.context.code
          );
          if (targetTemperature === minLimitTemperature) {
            await platform.uponorProxy.setTargetTemperature(
              thermostatAccessory.context.code,
              platform.uponorProxy.getMaxLimitTemperature(thermostatAccessory.context.code)
            );
          }
        } else {
          const targetTemperature: BigNumber = await platform.uponorProxy.getTargetTemperature(
            thermostatAccessory.context.code
          );
          const maxLimitTemperature: BigNumber = platform.uponorProxy.getMaxLimitTemperature(
            thermostatAccessory.context.code
          );
          if (targetTemperature === maxLimitTemperature) {
            await platform.uponorProxy.setTargetTemperature(
              thermostatAccessory.context.code,
              platform.uponorProxy.getMinLimitTemperature(thermostatAccessory.context.code)
            );
          }
        }
      }

      await platform.uponorProxy.setAwayMode(isAwayEnabled);
      accessory.context.isAwayEnabled = isAwayEnabled;
    });
};
