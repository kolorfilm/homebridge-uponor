import { createUponorAPI, UponorAPI } from './UponorAPI';
import { UponorDevice, UponorDeviceState } from '../devices/UponorDevice';
import { Mutex } from 'async-mutex';
import { Logger } from 'homebridge';
import { UponorAPIData } from './UponorAPIData';
import BigNumber from 'bignumber.js';
import { TemperatureDisplayUnit } from '../settings';
import { UponorCoolingMode } from '../devices/UponorCoolingMode';
import { UponorAwayMode } from '../devices/UponorAwayMode';

const EXPIRATION_TIME = 5000;

export interface UponorProxy {
  getDevices: () => Promise<UponorDevice[]>;
  getCoolingMode: () => Promise<UponorCoolingMode>;
  getAwayMode: () => Promise<UponorAwayMode>;
  getCurrentHeatingCoolingState: (thermostat: string) => Promise<UponorDeviceState>;
  getCurrentTemperature: (thermostat: string) => Promise<BigNumber>;
  getHumidity: (thermostat: string) => Promise<BigNumber>;
  getTargetTemperature: (thermostat: string) => Promise<BigNumber>;
  setTargetTemperature: (thermostat: string, targetTemperature: BigNumber) => Promise<void>;
  getMinLimitTemperature: (thermostat: string) => BigNumber;
  getMaxLimitTemperature: (thermostat: string) => BigNumber;
  getName: (thermostat: string) => Promise<string>;
  isOn: (thermostat: string) => Promise<boolean>;
  isCoolingEnabled: () => Promise<boolean>;
  isAwayEnabled: () => Promise<boolean>;
  isEcoEnabled: (thermostat: string) => Promise<boolean>;
  setCoolingMode: (newCoolingMode: boolean) => Promise<void>;
  setAwayMode: (newAwayMode: boolean) => Promise<void>;
}

export const createUponorProxy = (
  log: Logger,
  host: string,
  displayUnit: TemperatureDisplayUnit
): UponorProxy => {
  let lastUpdatedAt: Date | null = null;
  let uponorData: UponorAPIData | null = null;
  const mutex: Mutex = new Mutex();
  const uponorApi: UponorAPI = createUponorAPI(log, host);

  const updateData = (): Promise<void> =>
    mutex.runExclusive(async (): Promise<void> => {
      if (lastUpdatedAt && new Date().getTime() - lastUpdatedAt.getTime() < EXPIRATION_TIME) {
        return;
      }

      uponorData = await uponorApi.getData();
      lastUpdatedAt = new Date();
    });

  const toUponorCurrentHvacMode = (isOn: boolean, isCoolingEnabled: boolean): UponorDeviceState => {
    if (!isOn) {
      return UponorDeviceState.OFF;
    }
    if (isCoolingEnabled) {
      return UponorDeviceState.COOLING;
    }
    return UponorDeviceState.HEATING;
  };

  const calculateCurrentTemperature = (thermostat: string): BigNumber => {
    const isDisplayUnitCelsius: boolean = displayUnit === TemperatureDisplayUnit.CELSIUS;
    const currentTemperature: BigNumber = uponorData!.getCurrentTemperature(thermostat);
    if (isDisplayUnitCelsius) {
      return currentTemperature;
    }
    return BigNumber(currentTemperature).times(9).div(5).plus(32);
  };

  const calculateTargetTemperature = (thermostat: string): BigNumber => {
    const isDisplayUnitCelsius: boolean = displayUnit === TemperatureDisplayUnit.CELSIUS;
    const targetTemperature: BigNumber = uponorData!.getTargetTemperature(thermostat);
    if (isDisplayUnitCelsius) {
      return targetTemperature;
    }
    return BigNumber(targetTemperature).times(9).div(5).plus(32);
  };

  const getDevices = async (): Promise<UponorDevice[]> => {
    await updateData();
    const deviceCodes: string[] = await uponorData!.getDeviceCodes();
    return deviceCodes.map((code: string): UponorDevice => {
      return {
        id: uponorData!.getId(code),
        code,
        name: uponorData!.getName(code),
        model: uponorData!.getModel(),
        version: uponorData!.getVersion(code),
        isOn: uponorData!.isOn(code),
        isEcoEnabled: uponorData!.isEcoEnabled(code),
        currentHvacMode: toUponorCurrentHvacMode(
          uponorData!.isOn(code),
          uponorData!.isCoolingEnabled()
        ),
        currentTemperature: calculateCurrentTemperature(code),
        targetTemperature: calculateTargetTemperature(code),
        minLimitTemperature: getMinLimitTemperature(code),
        maxLimitTemperature: getMaxLimitTemperature(code),
        currentHumidity: uponorData!.getHumidity(code),
      };
    });
  };

  const getCoolingMode = async (): Promise<UponorCoolingMode> => ({
    model: uponorData!.getModel(),
    isCoolingEnabled: await isCoolingEnabled(),
  });

  const getAwayMode = async (): Promise<UponorAwayMode> => ({
    model: uponorData!.getModel(),
    isAwayEnabled: await isAwayEnabled(),
  });

  const getCurrentHeatingCoolingState = async (thermostat: string): Promise<UponorDeviceState> => {
    await updateData();
    return toUponorCurrentHvacMode(uponorData!.isOn(thermostat), uponorData!.isCoolingEnabled());
  };

  const getCurrentTemperature = async (thermostat: string): Promise<BigNumber> => {
    await updateData();
    return calculateCurrentTemperature(thermostat);
  };

  const getHumidity = async (thermostat: string): Promise<BigNumber> => {
    await updateData();
    return uponorData!.getHumidity(thermostat);
  };

  const getTargetTemperature = async (thermostat: string): Promise<BigNumber> => {
    await updateData();
    return calculateTargetTemperature(thermostat);
  };

  const setTargetTemperature = async (
    thermostat: string,
    targetTemperature: BigNumber
  ): Promise<void> => {
    uponorData!.setTargetTemperature(thermostat, targetTemperature);
    await uponorApi.setData(uponorData!.toSetTargetTemperaturePayload(thermostat));
    await updateData();
  };

  const getMinLimitTemperature = (thermostat: string): BigNumber => {
    const isDisplayUnitCelsius: boolean = displayUnit === TemperatureDisplayUnit.CELSIUS;
    const minLimit: BigNumber = uponorData!.getMinLimit(thermostat);
    if (isDisplayUnitCelsius) {
      return minLimit;
    }
    return BigNumber(minLimit).times(9).div(5).plus(32);
  };

  const getMaxLimitTemperature = (thermostat: string): BigNumber => {
    const isDisplayUnitCelsius: boolean = displayUnit === TemperatureDisplayUnit.CELSIUS;
    const maxLimit: BigNumber = uponorData!.getMaxLimit(thermostat);
    if (isDisplayUnitCelsius) {
      return maxLimit;
    }
    return BigNumber(maxLimit).times(9).div(5).plus(32);
  };

  const getName = async (thermostat: string): Promise<string> => {
    await updateData();
    return uponorData!.getName(thermostat);
  };

  const isOn = async (thermostat: string): Promise<boolean> => {
    await updateData();
    return uponorData!.isOn(thermostat);
  };

  const isCoolingEnabled = async (): Promise<boolean> => {
    await updateData();
    return uponorData!.isCoolingEnabled();
  };

  const isAwayEnabled = async (): Promise<boolean> => {
    await updateData();
    return uponorData!.isAwayEnabled();
  };

  const isEcoEnabled = async (thermostat: string): Promise<boolean> => {
    await updateData();
    return uponorData!.isEcoEnabled(thermostat);
  };

  const setCoolingMode = async (newCoolingMode: boolean): Promise<void> => {
    uponorData!.setCoolingMode(newCoolingMode);
    await uponorApi.setData(uponorData!.toSetCoolingModePayload());
    await updateData();
  };

  const setAwayMode = async (newAwayMode: boolean): Promise<void> => {
    uponorData!.setAwayMode(newAwayMode);
    await uponorApi.setData(uponorData!.toSetAwayModePayload());
    await updateData();
  };

  return {
    getDevices,
    getCoolingMode,
    getAwayMode,
    getCurrentHeatingCoolingState,
    getCurrentTemperature,
    getHumidity,
    getTargetTemperature,
    setTargetTemperature,
    getMinLimitTemperature,
    getMaxLimitTemperature,
    getName,
    isOn,
    isCoolingEnabled,
    isAwayEnabled,
    isEcoEnabled,
    setCoolingMode,
    setAwayMode,
  };
};
