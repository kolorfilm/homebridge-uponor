import BigNumber from 'bignumber.js';

type UponorJNAPVar = { waspVarName: string; waspVarValue: string };

export type UponorJNAPGetResponse = {
  result: string;
  output: {
    vars: UponorJNAPVar[];
  };
};

export type UponorJNAPSetPayload = {
  vars: UponorJNAPVar[];
};

export type UponorJNAPSetResponse = {
  result: string;
};

export interface UponorAPIData {
  getDeviceCodes: () => Promise<string[]>;
  isActive: (thermostat: string) => boolean;
  isCoolingEnabled: () => boolean;
  setCoolingMode: (newCoolingMode: boolean) => boolean;
  isOn: (thermostat: string) => boolean;
  getId: (thermostat: string) => string;
  getName: (thermostat: string) => string;
  getModel: () => string;
  getVersion: (thermostat: string) => string;
  getCurrentTemperature: (thermostat: string) => BigNumber;
  getHumidity: (thermostat: string) => BigNumber;
  getTargetTemperature: (thermostat: string) => BigNumber;
  setTargetTemperature: (thermostat: string, temperature: BigNumber) => BigNumber;
  getMinLimit: (thermostat: string) => BigNumber;
  getMaxLimit: (thermostat: string) => BigNumber;
  getActiveSetbackTemperature: (thermostat: string, targetTemperature: BigNumber) => BigNumber;
  toSetTargetTemperaturePayload: (thermostat: string) => UponorJNAPSetPayload;
  toSetCoolingModePayload: () => UponorJNAPSetPayload;
  toSetAwayModePayload: () => UponorJNAPSetPayload;
  isAwayEnabled: () => boolean;
  setAwayMode: (newAwayMode: boolean) => boolean;
  isEcoEnabled: (thermostat: string) => boolean;
}

const controllers: string[] = ['1', '2', '3', '4', '5'];
const thermostats: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

export const createEmptyUponorAPIData = (): UponorAPIData => {
  return createUponorAPIData({});
};

export const createUponorAPIDataFromResponse = (response: UponorJNAPGetResponse): UponorAPIData => {
  const data = response.output.vars.reduce(
    (acc: Record<string, string>, item: UponorJNAPVar): Record<string, string> => {
      return { ...acc, [item.waspVarName]: item.waspVarValue };
    },
    {}
  );
  return createUponorAPIData(data);
};

const createUponorAPIData = (initialData: Record<string, string>): UponorAPIData => {
  const data = initialData;

  const getDeviceCodes = async (): Promise<string[]> => {
    const codes: string[] = [];

    for (const controller of controllers) {
      if (data['sys_controller_' + controller + '_presence'] !== '1') {
        continue;
      }

      for (const thermostat of thermostats) {
        if (data['C' + controller + '_thermostat_' + thermostat + '_presence'] === '1') {
          codes.push('C' + controller + '_T' + thermostat);
        }
      }
    }

    return codes;
  };

  const isActive = (thermostat: string): boolean => {
    return data[thermostat + '_stat_cb_actuator'] === '1';
  };

  const isCoolingEnabled = (): boolean => {
    return data['sys_heat_cool_mode'] === '1';
  };

  const setCoolingMode = (newCoolingMode: boolean): boolean => {
    data['sys_heat_cool_mode'] = newCoolingMode ? '1' : '0';
    return newCoolingMode;
  };

  const getCurrentTemperature = (thermostat: string): BigNumber => {
    return BigNumber(data[thermostat + '_room_temperature'])
      .minus(320)
      .div(18);
  };

  const getMinLimit = (thermostat: string): BigNumber => {
    return BigNumber(data[thermostat + '_minimum_setpoint'])
      .minus(320)
      .div(18);
  };

  const getMaxLimit = (thermostat: string): BigNumber => {
    return BigNumber(data[thermostat + '_maximum_setpoint'])
      .minus(320)
      .div(18);
  };

  const isOn = (thermostat: string): boolean => {
    return !(
      (isCoolingEnabled() && getCurrentTemperature(thermostat).gte(getMaxLimit(thermostat))) ||
      (!isCoolingEnabled() && getCurrentTemperature(thermostat).lte(getMinLimit(thermostat)))
    );
  };

  const getId = (thermostat: string): string => {
    return data[thermostat.replace('T', 'thermostat') + '_id'];
  };

  const getName = (thermostat: string): string => {
    return data['cust_' + thermostat + '_name'];
  };

  const getModel = (): string => {
    return data['cust_SW_version_update'] || 'Uponor Smatrix';
  };

  const getVersion = (thermostat: string): string => {
    return data[thermostat + '_sw_version'];
  };

  const getHumidity = (thermostat: string): BigNumber => {
    const humidity = data[thermostat + '_rh'];
    return humidity ? BigNumber(humidity) : BigNumber(0);
  };

  const isAwayEnabled = (): boolean => {
    return data['sys_forced_eco_mode'] === '1';
  };

  const isEcoEnabled = (thermostat: string): boolean => {
    if (data[thermostat + '_eco_offset'] === '0') {
      return false;
    }
    return (
      data[thermostat + '_stat_cb_comfort_eco_mode'] === '1' ||
      data['cust_Temporary_ECO_Activation'] === '1'
    );
  };

  const getActiveSetbackTemperature = (
    thermostat: string,
    targetTemperature: BigNumber
  ): BigNumber => {
    if (
      targetTemperature === getMinLimit(thermostat) ||
      targetTemperature === getMaxLimit(thermostat)
    ) {
      return BigNumber(0);
    }

    const cool_setback: BigNumber = isCoolingEnabled()
      ? BigNumber(data['sys_heat_cool_offset']).negated()
      : BigNumber(0);

    let eco_setback: BigNumber = BigNumber(0);
    if (isEcoEnabled(thermostat) || isAwayEnabled()) {
      eco_setback = BigNumber(data[thermostat + '_eco_offset']);
      if (isCoolingEnabled()) {
        eco_setback = eco_setback.negated();
      }
    }

    return cool_setback.plus(eco_setback);
  };

  const getTargetTemperature = (thermostat: string): BigNumber => {
    const temperature: BigNumber = BigNumber(data[thermostat + '_setpoint'])
      .minus(320)
      .div(1.8)
      .dp(0, BigNumber.ROUND_FLOOR)
      .div(10);
    const setback: BigNumber = getActiveSetbackTemperature(thermostat, temperature);
    return BigNumber(data[thermostat + '_setpoint'])
      .minus(setback)
      .minus(320)
      .div(1.8)
      .dp(0, BigNumber.ROUND_FLOOR)
      .div(10);
  };

  const setTargetTemperature = (thermostat: string, temperature: BigNumber): BigNumber => {
    const setback: BigNumber = getActiveSetbackTemperature(thermostat, temperature);
    const targetTemperature: BigNumber = temperature.times(18).plus(setback).plus(320);
    data[thermostat + '_setpoint'] = targetTemperature.toFixed();
    return targetTemperature;
  };

  const toSetTargetTemperaturePayload = (thermostat: string): UponorJNAPSetPayload => {
    return {
      vars: [
        {
          waspVarName: thermostat + '_setpoint',
          waspVarValue: data[thermostat + '_setpoint'],
        },
      ],
    };
  };

  const toSetCoolingModePayload = (): UponorJNAPSetPayload => {
    return {
      vars: [
        {
          waspVarName: 'sys_heat_cool_mode',
          waspVarValue: data['sys_heat_cool_mode'],
        },
      ],
    };
  };

  const toSetAwayModePayload = (): UponorJNAPSetPayload => {
    return {
      vars: [
        {
          waspVarName: 'sys_forced_eco_mode',
          waspVarValue: data['sys_forced_eco_mode'],
        },
      ],
    };
  };

  const setAwayMode = (newAwayMode: boolean): boolean => {
    data['sys_forced_eco_mode'] = newAwayMode ? '1' : '0';
    return newAwayMode;
  };

  return {
    getDeviceCodes,
    isActive,
    isCoolingEnabled,
    setCoolingMode,
    isOn,
    getId,
    getName,
    getModel,
    getVersion,
    getCurrentTemperature,
    getHumidity,
    getTargetTemperature,
    setTargetTemperature,
    getMinLimit,
    getMaxLimit,
    getActiveSetbackTemperature,
    toSetTargetTemperaturePayload,
    toSetCoolingModePayload,
    toSetAwayModePayload,
    isAwayEnabled,
    setAwayMode,
    isEcoEnabled,
  };
};
