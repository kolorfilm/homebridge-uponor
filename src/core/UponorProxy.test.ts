import { createUponorProxy, UponorProxy } from './UponorProxy';
import { UponorDeviceState } from '../devices/UponorDevice';
import { TemperatureDisplayUnit } from '../settings';
import BigNumber from 'bignumber.js';
import type { Logger } from 'homebridge';
import type { UponorAPI } from './UponorAPI';
import type { UponorAPIData } from './UponorAPIData';

// Mock modules
vi.mock('./UponorAPI', () => ({
  createUponorAPI: vi.fn(),
}));
vi.mock('async-mutex', () => ({
  Mutex: class MockMutex {
    async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
      return callback();
    }
  },
}));

describe('UponorProxy', () => {
  let mockLogger: Logger;
  let mockUponorApi: UponorAPI;
  let mockUponorData: UponorAPIData;
  let proxy: UponorProxy;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    // Setup mock API data
    mockUponorData = {
      getDeviceCodes: vi.fn().mockResolvedValue(['T1', 'T2']),
      getId: vi.fn((code: string) => `id-${code}`),
      getName: vi.fn((code: string) => `Thermostat ${code}`),
      getModel: vi.fn().mockReturnValue('Uponor Smatrix'),
      getVersion: vi.fn().mockReturnValue('1.0.0'),
      isOn: vi.fn().mockReturnValue(true),
      isEcoEnabled: vi.fn().mockReturnValue(false),
      isCoolingEnabled: vi.fn().mockReturnValue(false),
      isAwayEnabled: vi.fn().mockReturnValue(false),
      getCurrentTemperature: vi.fn().mockReturnValue(BigNumber(20)),
      getTargetTemperature: vi.fn().mockReturnValue(BigNumber(22)),
      getMinLimit: vi.fn().mockReturnValue(BigNumber(5)),
      getMaxLimit: vi.fn().mockReturnValue(BigNumber(35)),
      getHumidity: vi.fn().mockReturnValue(BigNumber(45)),
      setTargetTemperature: vi.fn(),
      setCoolingMode: vi.fn(),
      setAwayMode: vi.fn(),
      toSetTargetTemperaturePayload: vi.fn().mockReturnValue({}),
      toSetCoolingModePayload: vi.fn().mockReturnValue({}),
      toSetAwayModePayload: vi.fn().mockReturnValue({}),
    } as unknown as UponorAPIData;

    // Setup mock API
    mockUponorApi = {
      getData: vi.fn().mockResolvedValue(mockUponorData),
      setData: vi.fn().mockResolvedValue(undefined),
    } as unknown as UponorAPI;

    // Mock the createUponorAPI function
    const { createUponorAPI } = await import('./UponorAPI');
    vi.mocked(createUponorAPI).mockReturnValue(mockUponorApi);
  });

  describe('createUponorProxy', () => {
    it('should create a proxy instance', () => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
      expect(proxy).toBeDefined();
      expect(proxy.getDevices).toBeInstanceOf(Function);
    });

    it('should create proxy with all required methods', () => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);

      expect(proxy.getDevices).toBeInstanceOf(Function);
      expect(proxy.getCoolingMode).toBeInstanceOf(Function);
      expect(proxy.getAwayMode).toBeInstanceOf(Function);
      expect(proxy.getCurrentHeatingCoolingState).toBeInstanceOf(Function);
      expect(proxy.getCurrentTemperature).toBeInstanceOf(Function);
      expect(proxy.getHumidity).toBeInstanceOf(Function);
      expect(proxy.getTargetTemperature).toBeInstanceOf(Function);
      expect(proxy.setTargetTemperature).toBeInstanceOf(Function);
      expect(proxy.getMinLimitTemperature).toBeInstanceOf(Function);
      expect(proxy.getMaxLimitTemperature).toBeInstanceOf(Function);
      expect(proxy.getName).toBeInstanceOf(Function);
      expect(proxy.isOn).toBeInstanceOf(Function);
      expect(proxy.isCoolingEnabled).toBeInstanceOf(Function);
      expect(proxy.isAwayEnabled).toBeInstanceOf(Function);
      expect(proxy.isEcoEnabled).toBeInstanceOf(Function);
      expect(proxy.setCoolingMode).toBeInstanceOf(Function);
      expect(proxy.setAwayMode).toBeInstanceOf(Function);
    });
  });

  describe('getDevices', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return list of devices', async () => {
      const devices = await proxy.getDevices();

      expect(devices).toHaveLength(2);
      expect(devices[0].code).toBe('T1');
      expect(devices[1].code).toBe('T2');
    });

    it('should fetch data from API', async () => {
      await proxy.getDevices();

      expect(mockUponorApi.getData).toHaveBeenCalled();
    });

    it('should map device properties correctly', async () => {
      const devices = await proxy.getDevices();
      const device = devices[0];

      expect(device.id).toBe('id-T1');
      expect(device.name).toBe('Thermostat T1');
      expect(device.model).toBe('Uponor Smatrix');
      expect(device.version).toBe('1.0.0');
      expect(device.isOn).toBe(true);
      expect(device.isEcoEnabled).toBe(false);
      expect(device.currentTemperature.toNumber()).toBe(20);
      expect(device.targetTemperature.toNumber()).toBe(22);
    });

    it('should set correct HVAC mode when device is on and heating', async () => {
      vi.mocked(mockUponorData.isOn).mockReturnValue(true);
      vi.mocked(mockUponorData.isCoolingEnabled).mockReturnValue(false);

      const devices = await proxy.getDevices();

      expect(devices[0].currentHvacMode).toBe(UponorDeviceState.HEATING);
    });

    it('should set correct HVAC mode when device is on and cooling', async () => {
      vi.mocked(mockUponorData.isOn).mockReturnValue(true);
      vi.mocked(mockUponorData.isCoolingEnabled).mockReturnValue(true);

      const devices = await proxy.getDevices();

      expect(devices[0].currentHvacMode).toBe(UponorDeviceState.COOLING);
    });

    it('should set correct HVAC mode when device is off', async () => {
      vi.mocked(mockUponorData.isOn).mockReturnValue(false);

      const devices = await proxy.getDevices();

      expect(devices[0].currentHvacMode).toBe(UponorDeviceState.OFF);
    });
  });

  describe('Temperature conversion (Celsius)', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return current temperature in Celsius', async () => {
      vi.mocked(mockUponorData.getCurrentTemperature).mockReturnValue(BigNumber(20));

      const temp = await proxy.getCurrentTemperature('T1');

      expect(temp.toNumber()).toBe(20);
    });

    it('should return target temperature in Celsius', async () => {
      vi.mocked(mockUponorData.getTargetTemperature).mockReturnValue(BigNumber(22));

      const temp = await proxy.getTargetTemperature('T1');

      expect(temp.toNumber()).toBe(22);
    });

    it('should return min limit in Celsius', async () => {
      vi.mocked(mockUponorData.getMinLimit).mockReturnValue(BigNumber(5));

      await proxy.getCurrentTemperature('T1');

      const temp = proxy.getMinLimitTemperature('T1');

      expect(temp.toNumber()).toBe(5);
    });

    it('should return max limit in Celsius', async () => {
      vi.mocked(mockUponorData.getMaxLimit).mockReturnValue(BigNumber(35));

      await proxy.getCurrentTemperature('T1');

      const temp = proxy.getMaxLimitTemperature('T1');

      expect(temp.toNumber()).toBe(35);
    });
  });

  describe('Temperature conversion (Fahrenheit)', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.FAHRENHEIT);
    });

    it('should convert current temperature to Fahrenheit', async () => {
      vi.mocked(mockUponorData.getCurrentTemperature).mockReturnValue(BigNumber(20));

      const temp = await proxy.getCurrentTemperature('T1');

      // 20°C = 68°F
      expect(temp.toNumber()).toBe(68);
    });

    it('should convert target temperature to Fahrenheit', async () => {
      vi.mocked(mockUponorData.getTargetTemperature).mockReturnValue(BigNumber(0));

      const temp = await proxy.getTargetTemperature('T1');

      // 0°C = 32°F
      expect(temp.toNumber()).toBe(32);
    });

    it('should convert min limit to Fahrenheit', async () => {
      vi.mocked(mockUponorData.getMinLimit).mockReturnValue(BigNumber(5));

      await proxy.getCurrentTemperature('T1');

      const temp = proxy.getMinLimitTemperature('T1');

      // 5°C = 41°F
      expect(temp.toNumber()).toBe(41);
    });

    it('should convert max limit to Fahrenheit', async () => {
      vi.mocked(mockUponorData.getMaxLimit).mockReturnValue(BigNumber(35));

      await proxy.getCurrentTemperature('T1');

      const temp = proxy.getMaxLimitTemperature('T1');

      // 35°C = 95°F
      expect(temp.toNumber()).toBe(95);
    });
  });

  describe('getCurrentHeatingCoolingState', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return HEATING when device is on and not cooling', async () => {
      vi.mocked(mockUponorData.isOn).mockReturnValue(true);
      vi.mocked(mockUponorData.isCoolingEnabled).mockReturnValue(false);

      const state = await proxy.getCurrentHeatingCoolingState('T1');

      expect(state).toBe(UponorDeviceState.HEATING);
    });

    it('should return COOLING when device is on and cooling enabled', async () => {
      vi.mocked(mockUponorData.isOn).mockReturnValue(true);
      vi.mocked(mockUponorData.isCoolingEnabled).mockReturnValue(true);

      const state = await proxy.getCurrentHeatingCoolingState('T1');

      expect(state).toBe(UponorDeviceState.COOLING);
    });

    it('should return OFF when device is off', async () => {
      vi.mocked(mockUponorData.isOn).mockReturnValue(false);

      const state = await proxy.getCurrentHeatingCoolingState('T1');

      expect(state).toBe(UponorDeviceState.OFF);
    });
  });

  describe('getHumidity', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return humidity value', async () => {
      vi.mocked(mockUponorData.getHumidity).mockReturnValue(BigNumber(45));

      const humidity = await proxy.getHumidity('T1');

      expect(humidity.toNumber()).toBe(45);
    });
  });

  describe('setTargetTemperature', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should set target temperature', async () => {
      await proxy.getCurrentTemperature('T1');

      const newTemp = BigNumber(23);
      await proxy.setTargetTemperature('T1', newTemp);

      expect(mockUponorData.setTargetTemperature).toHaveBeenCalledWith('T1', newTemp);
      expect(mockUponorApi.setData).toHaveBeenCalled();
    });

    it('should update data after setting temperature', async () => {
      await proxy.getCurrentTemperature('T1');

      await proxy.setTargetTemperature('T1', BigNumber(23));

      expect(mockUponorApi.getData).toHaveBeenCalled();
    });
  });

  describe('getName', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return device name', async () => {
      const name = await proxy.getName('T1');

      expect(name).toBe('Thermostat T1');
    });
  });

  describe('isOn', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return true when device is on', async () => {
      vi.mocked(mockUponorData.isOn).mockReturnValue(true);

      await proxy.getCurrentTemperature('T1');

      const isOn = await proxy.isOn('T1');

      expect(isOn).toBe(true);
    });

    it('should return false when device is off', async () => {
      vi.mocked(mockUponorData.isOn).mockReturnValue(false);

      await proxy.getCurrentTemperature('T1');

      const isOn = await proxy.isOn('T1');

      expect(isOn).toBe(false);
    });
  });

  describe('isCoolingEnabled', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return true when cooling is enabled', async () => {
      vi.mocked(mockUponorData.isCoolingEnabled).mockReturnValue(true);

      const result = await proxy.isCoolingEnabled();

      expect(result).toBe(true);
    });

    it('should return false when cooling is disabled', async () => {
      vi.mocked(mockUponorData.isCoolingEnabled).mockReturnValue(false);

      const result = await proxy.isCoolingEnabled();

      expect(result).toBe(false);
    });
  });

  describe('isAwayEnabled', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return true when away mode is enabled', async () => {
      vi.mocked(mockUponorData.isAwayEnabled).mockReturnValue(true);

      const result = await proxy.isAwayEnabled();

      expect(result).toBe(true);
    });

    it('should return false when away mode is disabled', async () => {
      vi.mocked(mockUponorData.isAwayEnabled).mockReturnValue(false);

      const result = await proxy.isAwayEnabled();

      expect(result).toBe(false);
    });
  });

  describe('isEcoEnabled', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return true when eco mode is enabled', async () => {
      vi.mocked(mockUponorData.isEcoEnabled).mockReturnValue(true);

      const result = await proxy.isEcoEnabled('T1');

      expect(result).toBe(true);
    });

    it('should return false when eco mode is disabled', async () => {
      vi.mocked(mockUponorData.isEcoEnabled).mockReturnValue(false);

      const result = await proxy.isEcoEnabled('T1');

      expect(result).toBe(false);
    });
  });

  describe('setCoolingMode', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should enable cooling mode', async () => {
      await proxy.getCurrentTemperature('T1');

      await proxy.setCoolingMode(true);

      expect(mockUponorData.setCoolingMode).toHaveBeenCalledWith(true);
      expect(mockUponorApi.setData).toHaveBeenCalled();
    });

    it('should disable cooling mode', async () => {
      await proxy.getCurrentTemperature('T1');

      await proxy.setCoolingMode(false);

      expect(mockUponorData.setCoolingMode).toHaveBeenCalledWith(false);
      expect(mockUponorApi.setData).toHaveBeenCalled();
    });
  });

  describe('setAwayMode', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should enable away mode', async () => {
      await proxy.getCurrentTemperature('T1');

      await proxy.setAwayMode(true);

      expect(mockUponorData.setAwayMode).toHaveBeenCalledWith(true);
      expect(mockUponorApi.setData).toHaveBeenCalled();
    });

    it('should disable away mode', async () => {
      await proxy.getCurrentTemperature('T1');

      await proxy.setAwayMode(false);

      expect(mockUponorData.setAwayMode).toHaveBeenCalledWith(false);
      expect(mockUponorApi.setData).toHaveBeenCalled();
    });
  });

  describe('getCoolingMode', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return cooling mode object', async () => {
      vi.mocked(mockUponorData.isCoolingEnabled).mockReturnValue(true);

      await proxy.getCurrentTemperature('T1');

      const coolingMode = await proxy.getCoolingMode();

      expect(coolingMode.model).toBe('Uponor Smatrix');
      expect(coolingMode.isCoolingEnabled).toBe(true);
    });
  });

  describe('getAwayMode', () => {
    beforeEach(() => {
      proxy = createUponorProxy(mockLogger, '192.168.1.100', TemperatureDisplayUnit.CELSIUS);
    });

    it('should return away mode object', async () => {
      vi.mocked(mockUponorData.isAwayEnabled).mockReturnValue(true);

      await proxy.getCurrentTemperature('T1');

      const awayMode = await proxy.getAwayMode();

      expect(awayMode.model).toBe('Uponor Smatrix');
      expect(awayMode.isAwayEnabled).toBe(true);
    });
  });
});
