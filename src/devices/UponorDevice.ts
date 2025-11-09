import BigNumber from 'bignumber.js';

export type UponorDevice = {
  id: string;
  code: string;
  name: string | undefined;
  model: string;
  version: string;
  isOn: boolean;
  isEcoEnabled: boolean;
  currentHvacMode: UponorDeviceState;
  currentTemperature: BigNumber | undefined;
  targetTemperature: BigNumber | undefined;
  minLimitTemperature: BigNumber | undefined;
  maxLimitTemperature: BigNumber | undefined;
  currentHumidity: BigNumber | undefined;
};

export enum UponorDeviceState {
  OFF = 'OFF',
  HEATING = 'HEATING',
  COOLING = 'COOLING',
}
