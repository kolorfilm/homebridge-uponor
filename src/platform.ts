import {
  API,
  Categories,
  Characteristic,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME, TemperatureDisplayUnit } from './settings';
import { createUponorThermostatAccessory } from './accessories/UponorThermostatAccessory';
import { createUponorProxy, UponorProxy } from './core/UponorProxy';
import { UponorDevice, UponorDeviceState } from './devices/UponorDevice';
import { UponorCoolingMode } from './devices/UponorCoolingMode';
import { createUponorCoolingSwitchAccessory } from './accessories/UponorCoolingSwitchAccessory';
import { UponorAwayMode } from './devices/UponorAwayMode';
import { createUponorAwaySwitchAccessory } from './accessories/UponorAwaySwitchAccessory';

export class UponorPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly uponorProxy: UponorProxy;

  public readonly cachedAccessories: PlatformAccessory[] = [];

  // Accessories tracking for background polling
  private thermostatAccessories: PlatformAccessory<UponorDevice>[] = [];
  private coolingSwitchAccessory?: PlatformAccessory<UponorCoolingMode>;
  private awaySwitchAccessory?: PlatformAccessory<UponorAwayMode>;

  // Background polling
  private pollingInterval?: NodeJS.Timeout;
  private readonly POLLING_INTERVAL_MS = 10000; // 10 seconds

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API
  ) {
    this.log.debug('Finished initializing platform:');
    this.log.debug('  - IP or Host:', this.config.host);
    this.log.debug('  - Display Unit:', this.config.displayUnit);

    this.uponorProxy = createUponorProxy(
      this.log,
      this.config.host,
      TemperatureDisplayUnit[this.config.displayUnit as keyof typeof TemperatureDisplayUnit]
    );

    this.api.on('didFinishLaunching', async (): Promise<void> => {
      log.debug('Executed didFinishLaunching callback');
      await this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.cachedAccessories.push(accessory);
  }

  async discoverDevices(): Promise<void> {
    const devices: UponorDevice[] = await this.uponorProxy.getDevices();
    this.log.info('Discovered devices:', devices.length);

    // Clear previous accessories
    this.thermostatAccessories = [];

    for (const device of devices) {
      const uuid: string = this.api.hap.uuid.generate(device.id);
      const existingAccessory: PlatformAccessory | undefined = this.cachedAccessories.find(
        (accessory: PlatformAccessory): boolean => accessory.UUID === uuid
      );

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        existingAccessory.context = device;
        this.api.updatePlatformAccessories([existingAccessory]);

        const typedAccessory = existingAccessory as PlatformAccessory<UponorDevice>;
        this.thermostatAccessories.push(typedAccessory);
        createUponorThermostatAccessory(this, typedAccessory);
      } else {
        this.log.info('Adding new accessory:', device.name || 'Uponor Thermostat');

        const accessory: PlatformAccessory<UponorDevice> = new this.api.platformAccessory(
          device.name || 'Uponor Thermostat',
          uuid,
          Categories.THERMOSTAT
        );

        accessory.context = device;

        this.thermostatAccessories.push(accessory);
        createUponorThermostatAccessory(this, accessory);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }

    const coolingMode: UponorCoolingMode = await this.uponorProxy.getCoolingMode();
    const coolingUuid: string = this.api.hap.uuid.generate('cooling-mode-switch');
    const existingCoolingAccessory: PlatformAccessory | undefined = this.cachedAccessories.find(
      (accessory: PlatformAccessory): boolean => accessory.UUID === coolingUuid
    );
    if (existingCoolingAccessory) {
      this.log.info(
        'Restoring existing accessory from cache:',
        existingCoolingAccessory.displayName
      );

      existingCoolingAccessory.context = coolingMode;
      this.api.updatePlatformAccessories([existingCoolingAccessory]);

      const typedAccessory = existingCoolingAccessory as PlatformAccessory<UponorCoolingMode>;
      this.coolingSwitchAccessory = typedAccessory;
      createUponorCoolingSwitchAccessory(this, typedAccessory, this.thermostatAccessories);
    } else {
      this.log.info('Adding new accessory:', 'Cold mode');

      const accessory: PlatformAccessory<UponorCoolingMode> = new this.api.platformAccessory(
        'Cold mode',
        coolingUuid,
        Categories.SWITCH
      );

      accessory.context = coolingMode;
      this.coolingSwitchAccessory = accessory;

      createUponorCoolingSwitchAccessory(this, accessory, this.thermostatAccessories);

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }

    const awayMode: UponorAwayMode = await this.uponorProxy.getAwayMode();
    const awayUuid: string = this.api.hap.uuid.generate('away-mode-switch');
    const existingAwayAccessory: PlatformAccessory | undefined = this.cachedAccessories.find(
      (accessory: PlatformAccessory): boolean => accessory.UUID === awayUuid
    );
    if (existingAwayAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAwayAccessory.displayName);

      existingAwayAccessory.context = awayMode;
      this.api.updatePlatformAccessories([existingAwayAccessory]);

      const typedAccessory = existingAwayAccessory as PlatformAccessory<UponorAwayMode>;
      this.awaySwitchAccessory = typedAccessory;
      createUponorAwaySwitchAccessory(this, typedAccessory, this.thermostatAccessories);
    } else {
      this.log.info('Adding new accessory:', 'Vacation Mode');

      const accessory: PlatformAccessory<UponorAwayMode> = new this.api.platformAccessory(
        'Vacation Mode',
        awayUuid,
        Categories.SWITCH
      );

      accessory.context = awayMode;
      this.awaySwitchAccessory = accessory;

      createUponorAwaySwitchAccessory(this, accessory, this.thermostatAccessories);

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }

    // Start background polling after all accessories are set up
    this.startPolling();
  }

  /**
   * Converts UponorDeviceState to HomeKit CurrentHeatingCoolingState
   */
  private toCurrentHeatingCoolingState(state: UponorDeviceState): number {
    switch (state) {
      case UponorDeviceState.HEATING:
        return this.Characteristic.CurrentHeatingCoolingState.HEAT;
      case UponorDeviceState.COOLING:
        return this.Characteristic.CurrentHeatingCoolingState.COOL;
      default:
        return this.Characteristic.CurrentHeatingCoolingState.OFF;
    }
  }

  /**
   * Starts the background polling interval to update all accessories
   */
  private startPolling(): void {
    this.log.info('Starting background polling every', this.POLLING_INTERVAL_MS / 1000, 'seconds');

    // Stop any existing polling first
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Initial update
    this.updateAllAccessories().catch((error) => {
      this.log.error('Error during initial update:', error);
    });

    // Regular updates
    this.pollingInterval = setInterval(() => {
      this.updateAllAccessories().catch((error) => {
        this.log.error('Error during polling update:', error);
      });
    }, this.POLLING_INTERVAL_MS);
  }

  /**
   * Updates all accessories with fresh data from the Uponor API
   */
  private async updateAllAccessories(): Promise<void> {
    try {
      // Fetch fresh data (cached by Proxy for EXPIRATION_TIME)
      const devices = await this.uponorProxy.getDevices();

      // Update all thermostat accessories
      for (const device of devices) {
        const uuid = this.api.hap.uuid.generate(device.id);
        const accessory = this.thermostatAccessories.find((acc) => acc.UUID === uuid);

        if (accessory) {
          this.updateThermostatAccessory(accessory, device);
        }
      }

      // Update away switch
      if (this.awaySwitchAccessory) {
        const isAwayEnabled = await this.uponorProxy.isAwayEnabled();
        this.updateAwaySwitchAccessory(this.awaySwitchAccessory, isAwayEnabled);
      }

      // Update cooling switch
      if (this.coolingSwitchAccessory) {
        const isCoolingEnabled = await this.uponorProxy.isCoolingEnabled();
        this.updateCoolingSwitchAccessory(this.coolingSwitchAccessory, isCoolingEnabled);
      }
    } catch (error) {
      this.log.error('Failed to update accessories:', error);
    }
  }

  /**
   * Updates a thermostat accessory with new device data
   */
  private updateThermostatAccessory(
    accessory: PlatformAccessory<UponorDevice>,
    device: UponorDevice
  ): void {
    // Update context with fresh data
    accessory.context.currentHvacMode = device.currentHvacMode;
    accessory.context.currentTemperature = device.currentTemperature;
    accessory.context.targetTemperature = device.targetTemperature;
    accessory.context.currentHumidity = device.currentHumidity;
    accessory.context.name = device.name;
    accessory.context.isOn = device.isOn;

    // Get service and update characteristics
    const service = accessory.getService(this.Service.Thermostat);
    if (!service) {
      return;
    }

    // Current Heating Cooling State
    const hvacState = this.toCurrentHeatingCoolingState(device.currentHvacMode);
    service
      .getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
      .updateValue(hvacState);

    // Current Temperature
    const currentTemp = device.currentTemperature?.toNumber();
    if (currentTemp !== undefined && !isNaN(currentTemp) && isFinite(currentTemp)) {
      service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(currentTemp);
    }

    // Target Temperature
    const targetTemp = device.targetTemperature?.toNumber();
    if (targetTemp !== undefined && !isNaN(targetTemp) && isFinite(targetTemp)) {
      service.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(targetTemp);
    }

    // Humidity
    const humidity = device.currentHumidity?.toNumber();
    if (humidity !== undefined && !isNaN(humidity) && isFinite(humidity)) {
      service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(humidity);
    }

    // Name
    if (device.name && device.name !== 'undefined') {
      service.getCharacteristic(this.Characteristic.Name).updateValue(device.name);
    }
  }

  /**
   * Updates the away switch accessory
   */
  private updateAwaySwitchAccessory(
    accessory: PlatformAccessory<UponorAwayMode>,
    isAwayEnabled: boolean
  ): void {
    accessory.context.isAwayEnabled = isAwayEnabled;

    const service = accessory.getService(this.Service.Switch);
    if (service) {
      service.getCharacteristic(this.Characteristic.On).updateValue(isAwayEnabled);
    }
  }

  /**
   * Updates the cooling switch accessory
   */
  private updateCoolingSwitchAccessory(
    accessory: PlatformAccessory<UponorCoolingMode>,
    isCoolingEnabled: boolean
  ): void {
    accessory.context.isCoolingEnabled = isCoolingEnabled;

    const service = accessory.getService(this.Service.Switch);
    if (service) {
      service.getCharacteristic(this.Characteristic.On).updateValue(isCoolingEnabled);
    }
  }
}
