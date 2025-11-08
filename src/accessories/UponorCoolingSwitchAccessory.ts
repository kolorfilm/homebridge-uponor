import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { UponorPlatform } from '../platform';
import { UponorCoolingMode } from '../devices/UponorCoolingMode';
import { MANUFACTURER } from '../devices/const';
import { UponorDevice } from '../devices/UponorDevice';
import BigNumber from 'bignumber.js';

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
  service
    .getCharacteristic(platform.Characteristic.On)
    .onGet(async (): Promise<boolean> => {
      try {
        return await platform.uponorProxy.isCoolingEnabled();
      } catch (error) {
        platform.log.error('Error getting cooling mode status:', error);
        return accessory.context.isCoolingEnabled;
      }
    })
    .onSet(async (value: CharacteristicValue): Promise<void> => {
      const isCoolingEnabled: boolean = value as boolean;

      for (const thermostatAccessory of thermostatAccessories) {
        if (isCoolingEnabled) {
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

      await platform.uponorProxy.setCoolingMode(isCoolingEnabled);
      accessory.context.isCoolingEnabled = isCoolingEnabled;
    });
};
