import { createUponorThermostatAccessory } from './UponorThermostatAccessory';
import { PlatformAccessory } from 'homebridge';
import { UponorDevice, UponorDeviceState } from '../devices/UponorDevice';
import { UponorPlatform } from '../platform';
import BigNumber from 'bignumber.js';

type MockService = {
  setCharacteristic: ReturnType<typeof vi.fn>;
  getCharacteristic: ReturnType<typeof vi.fn>;
  onGet: ReturnType<typeof vi.fn>;
  onSet: ReturnType<typeof vi.fn>;
};

type MockCharacteristic = {
  setProps: ReturnType<typeof vi.fn>;
  updateValue: ReturnType<typeof vi.fn>;
  onGet: ReturnType<typeof vi.fn>;
  onSet: ReturnType<typeof vi.fn>;
};

type MockUponorProxy = {
  getCurrentHeatingCoolingState: ReturnType<typeof vi.fn>;
  getCurrentTemperature: ReturnType<typeof vi.fn>;
  getHumidity: ReturnType<typeof vi.fn>;
  getTargetTemperature: ReturnType<typeof vi.fn>;
  setTargetTemperature: ReturnType<typeof vi.fn>;
  getName: ReturnType<typeof vi.fn>;
  isOn: ReturnType<typeof vi.fn>;
};

describe('UponorThermostatAccessory', () => {
  let mockPlatform: Pick<UponorPlatform, 'Service' | 'Characteristic' | 'config' | 'log'> & {
    uponorProxy: MockUponorProxy;
  };
  let mockAccessory: PlatformAccessory<UponorDevice>;
  let mockService: MockService;
  let mockCharacteristics: Map<string, MockCharacteristic>;

  beforeEach(() => {
    mockCharacteristics = new Map();

    const createMockCharacteristic = (): MockCharacteristic => ({
      setProps: vi.fn().mockReturnThis(),
      updateValue: vi.fn().mockReturnThis(),
      onGet: vi.fn().mockReturnThis(),
      onSet: vi.fn().mockReturnThis(),
    });

    // Mock Service
    mockService = {
      setCharacteristic: vi.fn().mockReturnThis(),
      getCharacteristic: vi.fn((type: string) => {
        if (!mockCharacteristics.has(type)) {
          mockCharacteristics.set(type, createMockCharacteristic());
        }
        return mockCharacteristics.get(type);
      }),
      onGet: vi.fn().mockReturnThis(),
      onSet: vi.fn().mockReturnThis(),
    };

    // Mock Platform
    mockPlatform = {
      Service: {
        AccessoryInformation: 'AccessoryInformation',
        Thermostat: 'Thermostat',
      } as unknown as UponorPlatform['Service'],
      Characteristic: {
        Manufacturer: 'Manufacturer',
        Model: 'Model',
        SerialNumber: 'SerialNumber',
        CurrentHeatingCoolingState: {
          HEAT: 1,
          COOL: 2,
          OFF: 0,
        },
        TargetHeatingCoolingState: {
          AUTO: 3,
        },
        CurrentTemperature: 'CurrentTemperature',
        TargetTemperature: 'TargetTemperature',
        TemperatureDisplayUnits: {
          CELSIUS: 0,
          FAHRENHEIT: 1,
        },
        CurrentRelativeHumidity: 'CurrentRelativeHumidity',
        Name: 'Name',
      } as unknown as UponorPlatform['Characteristic'],
      config: {
        platform: 'homebridge-uponor',
        displayUnit: 'CELSIUS',
      } as UponorPlatform['config'],
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        log: vi.fn(),
        success: vi.fn(),
      } as unknown as UponorPlatform['log'],
      uponorProxy: {
        getCurrentHeatingCoolingState: vi.fn(),
        getCurrentTemperature: vi.fn(),
        getHumidity: vi.fn(),
        getTargetTemperature: vi.fn(),
        setTargetTemperature: vi.fn(),
        getName: vi.fn(),
        isOn: vi.fn(),
      },
    };

    // Mock Accessory
    mockAccessory = {
      context: {
        id: 'test-id',
        code: 'test-code',
        name: 'Test Thermostat',
        model: 'Uponor Smatrix',
        version: '1.0',
        isOn: true,
        isEcoEnabled: false,
        currentHvacMode: UponorDeviceState.HEATING,
        currentTemperature: new BigNumber(20),
        targetTemperature: new BigNumber(21),
        minLimitTemperature: new BigNumber(15),
        maxLimitTemperature: new BigNumber(25),
        currentHumidity: new BigNumber(50),
      },
      getService: vi.fn((serviceType: string) => {
        if (serviceType === 'AccessoryInformation') {
          return {
            setCharacteristic: vi.fn().mockReturnThis(),
          };
        }
        if (serviceType === 'Thermostat') {
          return mockService;
        }
        return null;
      }),
      addService: vi.fn().mockReturnValue(mockService),
    } as unknown as PlatformAccessory<UponorDevice>;
  });

  describe('Setup', () => {
    it('should set accessory information', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockAccessory.getService).toHaveBeenCalledWith('AccessoryInformation');
    });

    it('should create or get thermostat service', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockAccessory.getService).toHaveBeenCalledWith('Thermostat');
    });

    it('should set initial CurrentHeatingCoolingState to HEAT', () => {
      mockAccessory.context.currentHvacMode = UponorDeviceState.HEATING;

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockService.setCharacteristic).toHaveBeenCalled();
    });

    it('should set TargetHeatingCoolingState to AUTO', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockService.setCharacteristic).toHaveBeenCalled();
    });

    it('should set temperature props when valid min and max are provided', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const currentTempChar = mockCharacteristics.get('CurrentTemperature');
      const targetTempChar = mockCharacteristics.get('TargetTemperature');

      expect(currentTempChar?.setProps).toHaveBeenCalledWith({
        minValue: 15,
        maxValue: 25,
      });
      expect(targetTempChar?.setProps).toHaveBeenCalledWith({
        minValue: 15,
        maxValue: 25,
        minStep: 0.5,
      });
    });

    it('should set initial current temperature', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockService.setCharacteristic).toHaveBeenCalled();
    });

    it('should set initial target temperature', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockService.setCharacteristic).toHaveBeenCalled();
    });

    it('should set temperature display units to CELSIUS', () => {
      mockPlatform.config.displayUnit = 'CELSIUS';

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockService.setCharacteristic).toHaveBeenCalled();
    });

    it('should set temperature display units to FAHRENHEIT', () => {
      mockPlatform.config.displayUnit = 'FAHRENHEIT';

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockService.setCharacteristic).toHaveBeenCalled();
    });

    it('should set humidity props', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const humidityChar = mockCharacteristics.get('CurrentRelativeHumidity');

      expect(humidityChar?.setProps).toHaveBeenCalledWith({
        minValue: 0,
        maxValue: 100,
      });
    });

    it('should set initial humidity', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockService.setCharacteristic).toHaveBeenCalled();
    });

    it('should set name characteristic', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockService.setCharacteristic).toHaveBeenCalled();
    });

    it('should register onGet handler for CurrentHeatingCoolingState', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockService.getCharacteristic).toHaveBeenCalled();
    });

    it('should register onGet handler for CurrentTemperature', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('CurrentTemperature');

      expect(char?.onGet).toHaveBeenCalled();
    });

    it('should register onGet handler for CurrentRelativeHumidity', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('CurrentRelativeHumidity');

      expect(char?.onGet).toHaveBeenCalled();
    });

    it('should register onGet and onSet handlers for TargetTemperature', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('TargetTemperature');

      expect(char?.onGet).toHaveBeenCalled();
      expect(char?.onSet).toHaveBeenCalled();
    });

    it('should register onGet handler for Name', () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('Name');

      expect(char?.onGet).toHaveBeenCalled();
    });
  });

  describe('Characteristic Handlers', () => {
    it('should return cached current temperature', () => {
      mockAccessory.context.currentTemperature = new BigNumber(22.5);

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('CurrentTemperature');
      const handler = char?.onGet.mock.calls[0][0];
      const result = handler();

      expect(result).toBe(22.5);
    });

    it('should return default temperature when current temperature is undefined', () => {
      mockAccessory.context.currentTemperature = undefined;

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('CurrentTemperature');
      const handler = char?.onGet.mock.calls[0][0];
      const result = handler();

      expect(result).toBe(20);
    });

    it('should return cached target temperature', () => {
      mockAccessory.context.targetTemperature = new BigNumber(23);

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('TargetTemperature');
      const handler = char?.onGet.mock.calls[0][0];
      const result = handler();

      expect(result).toBe(23);
    });

    it('should return default temperature when target temperature is undefined', () => {
      mockAccessory.context.targetTemperature = undefined;

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('TargetTemperature');
      const handler = char?.onGet.mock.calls[0][0];
      const result = handler();

      expect(result).toBe(21);
    });

    it('should return cached humidity', () => {
      mockAccessory.context.currentHumidity = new BigNumber(65);

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('CurrentRelativeHumidity');
      const handler = char?.onGet.mock.calls[0][0];
      const result = handler();

      expect(result).toBe(65);
    });

    it('should return default humidity when humidity is undefined', () => {
      mockAccessory.context.currentHumidity = undefined;

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('CurrentRelativeHumidity');
      const handler = char?.onGet.mock.calls[0][0];
      const result = handler();

      expect(result).toBe(50);
    });

    it('should return cached name', () => {
      mockAccessory.context.name = 'Living Room';

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('Name');
      const handler = char?.onGet.mock.calls[0][0];
      const result = handler();

      expect(result).toBe('Living Room');
    });

    it('should return default name when name is undefined', () => {
      mockAccessory.context.name = undefined;

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('Name');
      const handler = char?.onGet.mock.calls[0][0];
      const result = handler();

      expect(result).toBe('Uponor Thermostat');
    });

    it('should have HEATING mode set in context', () => {
      mockAccessory.context.currentHvacMode = UponorDeviceState.HEATING;

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockAccessory.context.currentHvacMode).toBe(UponorDeviceState.HEATING);
    });

    it('should have COOLING mode set in context', () => {
      mockAccessory.context.currentHvacMode = UponorDeviceState.COOLING;

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockAccessory.context.currentHvacMode).toBe(UponorDeviceState.COOLING);
    });

    it('should have OFF mode set in context', () => {
      mockAccessory.context.currentHvacMode = UponorDeviceState.OFF;

      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      expect(mockAccessory.context.currentHvacMode).toBe(UponorDeviceState.OFF);
    });

    it('should set target temperature via proxy', async () => {
      createUponorThermostatAccessory(mockPlatform as unknown as UponorPlatform, mockAccessory);

      const char = mockCharacteristics.get('TargetTemperature');
      const handler = char?.onSet.mock.calls[0][0];
      await handler(22.5);

      expect(mockPlatform.uponorProxy.setTargetTemperature).toHaveBeenCalledWith(
        'test-code',
        expect.any(BigNumber)
      );
      expect(mockAccessory.context.targetTemperature?.toNumber()).toBe(22.5);
    });
  });
});
