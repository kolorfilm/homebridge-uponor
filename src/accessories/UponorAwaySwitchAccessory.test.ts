import { createUponorAwaySwitchAccessory } from './UponorAwaySwitchAccessory';
import { PlatformAccessory } from 'homebridge';
import { UponorAwayMode } from '../devices/UponorAwayMode';
import { UponorDevice } from '../devices/UponorDevice';
import { UponorPlatform } from '../platform';
import BigNumber from 'bignumber.js';

type MockService = {
  setCharacteristic: ReturnType<typeof vi.fn>;
  getCharacteristic: ReturnType<typeof vi.fn>;
  onGet: ReturnType<typeof vi.fn>;
  onSet: ReturnType<typeof vi.fn>;
};

type MockUponorProxy = {
  getTargetTemperature: ReturnType<typeof vi.fn>;
  getMinLimitTemperature: ReturnType<typeof vi.fn>;
  getMaxLimitTemperature: ReturnType<typeof vi.fn>;
  setTargetTemperature: ReturnType<typeof vi.fn>;
  setAwayMode: ReturnType<typeof vi.fn>;
};

describe('UponorAwaySwitchAccessory', () => {
  let mockPlatform: Pick<UponorPlatform, 'Service' | 'Characteristic' | 'log'> & {
    uponorProxy: MockUponorProxy;
  };
  let mockAccessory: PlatformAccessory<UponorAwayMode>;
  let mockThermostatAccessories: PlatformAccessory<UponorDevice>[];
  let mockService: MockService;
  let onGetHandler: (() => boolean) | undefined;
  let onSetHandler: ((value: boolean) => Promise<void>) | undefined;

  beforeEach(() => {
    // Reset handlers
    onGetHandler = undefined;
    onSetHandler = undefined;

    // Mock Service
    mockService = {
      setCharacteristic: vi.fn().mockReturnThis(),
      getCharacteristic: vi.fn().mockReturnThis(),
      onGet: vi.fn((handler) => {
        onGetHandler = handler;
        return mockService;
      }),
      onSet: vi.fn((handler) => {
        onSetHandler = handler;
        return mockService;
      }),
    };

    // Mock Platform
    mockPlatform = {
      Service: {
        AccessoryInformation: 'AccessoryInformation',
        Switch: 'Switch',
      } as unknown as UponorPlatform['Service'],
      Characteristic: {
        Manufacturer: 'Manufacturer',
        Model: 'Model',
        On: 'On',
        Name: 'Name',
      } as unknown as UponorPlatform['Characteristic'],
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        log: vi.fn(),
        success: vi.fn(),
      } as unknown as UponorPlatform['log'],
      uponorProxy: {
        getTargetTemperature: vi.fn(),
        getMinLimitTemperature: vi.fn(),
        getMaxLimitTemperature: vi.fn(),
        setTargetTemperature: vi.fn(),
        setAwayMode: vi.fn(),
      },
    };

    // Mock Accessory
    mockAccessory = {
      context: {
        model: 'Uponor Smatrix',
        isAwayEnabled: false,
      },
      getService: vi.fn((serviceType: string) => {
        if (serviceType === 'AccessoryInformation') {
          return {
            setCharacteristic: vi.fn().mockReturnThis(),
          };
        }
        return mockService;
      }),
      addService: vi.fn().mockReturnValue(mockService),
    } as unknown as PlatformAccessory<UponorAwayMode>;

    // Mock Thermostat Accessories
    mockThermostatAccessories = [
      {
        context: {
          code: 'thermostat-1',
        },
      } as unknown as PlatformAccessory<UponorDevice>,
    ];
  });

  describe('Setup', () => {
    it('should set accessory information', () => {
      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      expect(mockAccessory.getService).toHaveBeenCalledWith('AccessoryInformation');
    });

    it('should create or get switch service', () => {
      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      expect(mockAccessory.getService).toHaveBeenCalledWith('Switch');
    });

    it('should set initial On characteristic', () => {
      mockAccessory.context.isAwayEnabled = true;

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      expect(mockService.setCharacteristic).toHaveBeenCalledWith('On', true);
    });

    it('should set Name characteristic to Vacation Mode', () => {
      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      expect(mockService.setCharacteristic).toHaveBeenCalledWith('Name', 'Vacation Mode');
    });

    it('should register onGet handler', () => {
      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      expect(mockService.onGet).toHaveBeenCalled();
    });

    it('should register onSet handler', () => {
      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      expect(mockService.onSet).toHaveBeenCalled();
    });
  });

  describe('onGet Handler', () => {
    it('should return cached isAwayEnabled value when false', () => {
      mockAccessory.context.isAwayEnabled = false;

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      const result = onGetHandler!();

      expect(result).toBe(false);
    });

    it('should return cached isAwayEnabled value when true', () => {
      mockAccessory.context.isAwayEnabled = true;

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      const result = onGetHandler!();

      expect(result).toBe(true);
    });
  });

  describe('onSet Handler', () => {
    it('should call setAwayMode when enabling away mode', async () => {
      mockPlatform.uponorProxy.getTargetTemperature.mockResolvedValue(new BigNumber(20));
      mockPlatform.uponorProxy.getMinLimitTemperature.mockReturnValue(new BigNumber(15));

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      await onSetHandler!(true);

      expect(mockPlatform.uponorProxy.setAwayMode).toHaveBeenCalledWith(true);
    });

    it('should call setAwayMode when disabling away mode', async () => {
      mockPlatform.uponorProxy.getTargetTemperature.mockResolvedValue(new BigNumber(20));
      mockPlatform.uponorProxy.getMaxLimitTemperature.mockReturnValue(new BigNumber(25));

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      await onSetHandler!(false);

      expect(mockPlatform.uponorProxy.setAwayMode).toHaveBeenCalledWith(false);
    });

    it('should update context isAwayEnabled', async () => {
      mockPlatform.uponorProxy.getTargetTemperature.mockResolvedValue(new BigNumber(20));
      mockPlatform.uponorProxy.getMinLimitTemperature.mockReturnValue(new BigNumber(15));

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      await onSetHandler!(true);

      expect(mockAccessory.context.isAwayEnabled).toBe(true);
    });

    it('should set target to max when enabling away and target is at min', async () => {
      const minTemp = new BigNumber(15);
      const maxTemp = new BigNumber(25);
      mockPlatform.uponorProxy.getTargetTemperature.mockResolvedValue(minTemp);
      mockPlatform.uponorProxy.getMinLimitTemperature.mockReturnValue(minTemp);
      mockPlatform.uponorProxy.getMaxLimitTemperature.mockReturnValue(maxTemp);

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      await onSetHandler!(true);

      expect(mockPlatform.uponorProxy.setTargetTemperature).toHaveBeenCalledWith(
        'thermostat-1',
        maxTemp
      );
    });

    it('should not set target when enabling away and target is not at min', async () => {
      const targetTemp = new BigNumber(20);
      const minTemp = new BigNumber(15);
      mockPlatform.uponorProxy.getTargetTemperature.mockResolvedValue(targetTemp);
      mockPlatform.uponorProxy.getMinLimitTemperature.mockReturnValue(minTemp);

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      await onSetHandler!(true);

      expect(mockPlatform.uponorProxy.setTargetTemperature).not.toHaveBeenCalled();
    });

    it('should set target to min when disabling away and target is at max', async () => {
      const minTemp = new BigNumber(15);
      const maxTemp = new BigNumber(25);
      mockPlatform.uponorProxy.getTargetTemperature.mockResolvedValue(maxTemp);
      mockPlatform.uponorProxy.getMinLimitTemperature.mockReturnValue(minTemp);
      mockPlatform.uponorProxy.getMaxLimitTemperature.mockReturnValue(maxTemp);

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      await onSetHandler!(false);

      expect(mockPlatform.uponorProxy.setTargetTemperature).toHaveBeenCalledWith(
        'thermostat-1',
        minTemp
      );
    });

    it('should not set target when disabling away and target is not at max', async () => {
      const targetTemp = new BigNumber(20);
      const maxTemp = new BigNumber(25);
      mockPlatform.uponorProxy.getTargetTemperature.mockResolvedValue(targetTemp);
      mockPlatform.uponorProxy.getMaxLimitTemperature.mockReturnValue(maxTemp);

      createUponorAwaySwitchAccessory(
        mockPlatform as unknown as UponorPlatform,
        mockAccessory,
        mockThermostatAccessories
      );

      await onSetHandler!(false);

      expect(mockPlatform.uponorProxy.setTargetTemperature).not.toHaveBeenCalled();
    });
  });
});
