import BigNumber from 'bignumber.js';
import {
  createEmptyUponorAPIData,
  createUponorAPIDataFromResponse,
  UponorJNAPGetResponse,
} from './UponorAPIData';

describe('UponorAPIData', () => {
  describe('createEmptyUponorAPIData', () => {
    it('should create empty API data', async () => {
      const apiData = createEmptyUponorAPIData();

      expect(apiData).toBeDefined();
    });

    it('should return empty device codes', async () => {
      const apiData = createEmptyUponorAPIData();
      const codes = await apiData.getDeviceCodes();

      expect(codes).toEqual([]);
    });

    it('should return default temperature for undefined thermostat', () => {
      const apiData = createEmptyUponorAPIData();
      const temp = apiData.getCurrentTemperature('C1_T1');

      expect(temp.toNumber()).toBe(0);
    });

    it('should return default target temperature', () => {
      const apiData = createEmptyUponorAPIData();
      const temp = apiData.getTargetTemperature('C1_T1');

      expect(temp.toNumber()).toBe(21);
    });

    it('should return default min limit', () => {
      const apiData = createEmptyUponorAPIData();
      const min = apiData.getMinLimit('C1_T1');

      expect(min.toNumber()).toBe(5);
    });

    it('should return default max limit', () => {
      const apiData = createEmptyUponorAPIData();
      const max = apiData.getMaxLimit('C1_T1');

      expect(max.toNumber()).toBe(30);
    });

    it('should return default humidity', () => {
      const apiData = createEmptyUponorAPIData();
      const humidity = apiData.getHumidity('C1_T1');

      expect(humidity.toNumber()).toBe(0);
    });

    it('should return default name', () => {
      const apiData = createEmptyUponorAPIData();
      const name = apiData.getName('C1_T1');

      expect(name).toBe('Uponor Thermostat');
    });

    it('should return default model', () => {
      const apiData = createEmptyUponorAPIData();
      const model = apiData.getModel();

      expect(model).toBe('Uponor Smatrix');
    });

    it('should return false for cooling enabled by default', () => {
      const apiData = createEmptyUponorAPIData();
      const enabled = apiData.isCoolingEnabled();

      expect(enabled).toBe(false);
    });

    it('should return false for away enabled by default', () => {
      const apiData = createEmptyUponorAPIData();
      const enabled = apiData.isAwayEnabled();

      expect(enabled).toBe(false);
    });
  });

  describe('createUponorAPIDataFromResponse', () => {
    it('should create API data from response', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'sys_controller_1_presence', waspVarValue: '1' },
            { waspVarName: 'C1_thermostat_1_presence', waspVarValue: '1' },
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);

      expect(apiData).toBeDefined();
    });

    it('should parse device codes correctly', async () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'sys_controller_1_presence', waspVarValue: '1' },
            { waspVarName: 'C1_thermostat_1_presence', waspVarValue: '1' },
            { waspVarName: 'C1_thermostat_2_presence', waspVarValue: '1' },
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const codes = await apiData.getDeviceCodes();

      expect(codes).toEqual(['C1_T1', 'C1_T2']);
    });

    it('should parse multiple controllers', async () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'sys_controller_1_presence', waspVarValue: '1' },
            { waspVarName: 'C1_thermostat_1_presence', waspVarValue: '1' },
            { waspVarName: 'sys_controller_2_presence', waspVarValue: '1' },
            { waspVarName: 'C2_thermostat_1_presence', waspVarValue: '1' },
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const codes = await apiData.getDeviceCodes();

      expect(codes).toEqual(['C1_T1', 'C2_T1']);
    });

    it('should skip thermostats without presence', async () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'sys_controller_1_presence', waspVarValue: '1' },
            { waspVarName: 'C1_thermostat_1_presence', waspVarValue: '1' },
            { waspVarName: 'C1_thermostat_2_presence', waspVarValue: '0' },
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const codes = await apiData.getDeviceCodes();

      expect(codes).toEqual(['C1_T1']);
    });
  });

  describe('Temperature conversion', () => {
    it('should convert current temperature correctly', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_room_temperature', waspVarValue: '680' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const temp = apiData.getCurrentTemperature('C1_T1');

      expect(temp.toNumber()).toBe(20);
    });

    it('should convert 0°C correctly', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_room_temperature', waspVarValue: '320' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const temp = apiData.getCurrentTemperature('C1_T1');

      expect(temp.toNumber()).toBe(0);
    });

    it('should convert min limit correctly', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_minimum_setpoint', waspVarValue: '410' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const min = apiData.getMinLimit('C1_T1');

      expect(min.toNumber()).toBe(5);
    });

    it('should convert max limit correctly', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_maximum_setpoint', waspVarValue: '860' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const max = apiData.getMaxLimit('C1_T1');

      expect(max.toNumber()).toBe(30);
    });

    it('should convert target temperature correctly', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const target = apiData.getTargetTemperature('C1_T1');

      expect(target.toNumber()).toBe(21);
    });

    it('should set target temperature correctly', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      apiData.setTargetTemperature('C1_T1', new BigNumber(22));
      const target = apiData.getTargetTemperature('C1_T1');

      expect(target.toNumber()).toBe(22);
    });
  });

  describe('Device metadata', () => {
    it('should return thermostat ID', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_thermostat1_id', waspVarValue: 'ABC123' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const id = apiData.getId('C1_T1');

      expect(id).toBe('ABC123');
    });

    it('should return custom thermostat name', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'cust_C1_T1_name', waspVarValue: 'Living Room' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const name = apiData.getName('C1_T1');

      expect(name).toBe('Living Room');
    });

    it('should return custom model', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'cust_SW_version_update', waspVarValue: 'Smatrix Wave' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const model = apiData.getModel();

      expect(model).toBe('Smatrix Wave');
    });

    it('should return software version', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_sw_version', waspVarValue: '1.2.3' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const version = apiData.getVersion('C1_T1');

      expect(version).toBe('1.2.3');
    });

    it('should return humidity value', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_rh', waspVarValue: '65' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const humidity = apiData.getHumidity('C1_T1');

      expect(humidity.toNumber()).toBe(65);
    });
  });

  describe('Thermostat status', () => {
    it('should return true for active thermostat', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_stat_cb_actuator', waspVarValue: '1' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const active = apiData.isActive('C1_T1');

      expect(active).toBe(true);
    });

    it('should return false for inactive thermostat', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_stat_cb_actuator', waspVarValue: '0' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const active = apiData.isActive('C1_T1');

      expect(active).toBe(false);
    });

    it('should return true when thermostat is on in heating mode', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'sys_heat_cool_mode', waspVarValue: '0' },
            { waspVarName: 'C1_T1_room_temperature', waspVarValue: '680' }, // 20°C
            { waspVarName: 'C1_T1_minimum_setpoint', waspVarValue: '410' }, // 5°C
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const isOn = apiData.isOn('C1_T1');

      expect(isOn).toBe(true);
    });

    it('should return false when temperature at minimum in heating mode', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'sys_heat_cool_mode', waspVarValue: '0' },
            { waspVarName: 'C1_T1_room_temperature', waspVarValue: '410' }, // 5°C
            { waspVarName: 'C1_T1_minimum_setpoint', waspVarValue: '410' }, // 5°C
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const isOn = apiData.isOn('C1_T1');

      expect(isOn).toBe(false);
    });
  });

  describe('Cooling mode', () => {
    it('should return true when cooling is enabled', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'sys_heat_cool_mode', waspVarValue: '1' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const enabled = apiData.isCoolingEnabled();

      expect(enabled).toBe(true);
    });

    it('should set cooling mode to enabled', () => {
      const apiData = createEmptyUponorAPIData();
      const result = apiData.setCoolingMode(true);

      expect(result).toBe(true);
    });

    it('should set cooling mode to disabled', () => {
      const apiData = createEmptyUponorAPIData();
      const result = apiData.setCoolingMode(false);

      expect(result).toBe(false);
    });

    it('should generate cooling mode payload', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'sys_heat_cool_mode', waspVarValue: '1' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const payload = apiData.toSetCoolingModePayload();

      expect(payload).toEqual({
        vars: [{ waspVarName: 'sys_heat_cool_mode', waspVarValue: '1' }],
      });
    });
  });

  describe('Away mode', () => {
    it('should return true when away is enabled', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'sys_forced_eco_mode', waspVarValue: '1' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const enabled = apiData.isAwayEnabled();

      expect(enabled).toBe(true);
    });

    it('should set away mode to enabled', () => {
      const apiData = createEmptyUponorAPIData();
      const result = apiData.setAwayMode(true);

      expect(result).toBe(true);
    });

    it('should set away mode to disabled', () => {
      const apiData = createEmptyUponorAPIData();
      const result = apiData.setAwayMode(false);

      expect(result).toBe(false);
    });

    it('should generate away mode payload', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'sys_forced_eco_mode', waspVarValue: '1' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const payload = apiData.toSetAwayModePayload();

      expect(payload).toEqual({
        vars: [{ waspVarName: 'sys_forced_eco_mode', waspVarValue: '1' }],
      });
    });
  });

  describe('Eco mode', () => {
    it('should return true when eco is enabled', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'C1_T1_eco_offset', waspVarValue: '10' },
            { waspVarName: 'C1_T1_stat_cb_comfort_eco_mode', waspVarValue: '1' },
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const enabled = apiData.isEcoEnabled('C1_T1');

      expect(enabled).toBe(true);
    });

    it('should return false when eco offset is 0', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'C1_T1_eco_offset', waspVarValue: '0' },
            { waspVarName: 'C1_T1_stat_cb_comfort_eco_mode', waspVarValue: '1' },
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const enabled = apiData.isEcoEnabled('C1_T1');

      expect(enabled).toBe(false);
    });

    it('should return true when temporary eco is activated', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'C1_T1_eco_offset', waspVarValue: '10' },
            { waspVarName: 'cust_Temporary_ECO_Activation', waspVarValue: '1' },
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const enabled = apiData.isEcoEnabled('C1_T1');

      expect(enabled).toBe(true);
    });
  });

  describe('Setback temperature', () => {
    it('should return 0 for min limit temperature', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_minimum_setpoint', waspVarValue: '410' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const minLimit = apiData.getMinLimit('C1_T1');
      const setback = apiData.getActiveSetbackTemperature('C1_T1', minLimit);

      expect(setback.toNumber()).toBe(0);
    });

    it('should return 0 for max limit temperature', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_maximum_setpoint', waspVarValue: '860' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const maxLimit = apiData.getMaxLimit('C1_T1');
      const setback = apiData.getActiveSetbackTemperature('C1_T1', maxLimit);

      expect(setback.toNumber()).toBe(0);
    });

    it('should calculate setback with eco mode', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'C1_T1_eco_offset', waspVarValue: '20' },
            { waspVarName: 'C1_T1_stat_cb_comfort_eco_mode', waspVarValue: '1' },
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const setback = apiData.getActiveSetbackTemperature('C1_T1', new BigNumber(21));

      expect(setback.toNumber()).toBe(20);
    });

    it('should calculate setback with away mode', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'C1_T1_eco_offset', waspVarValue: '30' },
            { waspVarName: 'sys_forced_eco_mode', waspVarValue: '1' },
          ],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const setback = apiData.getActiveSetbackTemperature('C1_T1', new BigNumber(21));

      expect(setback.toNumber()).toBe(30);
    });
  });

  describe('Payload generation', () => {
    it('should generate target temperature payload', () => {
      const response: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
        },
      };

      const apiData = createUponorAPIDataFromResponse(response);
      const payload = apiData.toSetTargetTemperaturePayload('C1_T1');

      expect(payload).toEqual({
        vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
      });
    });

    it('should generate payload after setting temperature', () => {
      const apiData = createEmptyUponorAPIData();
      apiData.setTargetTemperature('C1_T1', new BigNumber(22));
      const payload = apiData.toSetTargetTemperaturePayload('C1_T1');

      expect(payload.vars[0].waspVarName).toBe('C1_T1_setpoint');
    });
  });
});
