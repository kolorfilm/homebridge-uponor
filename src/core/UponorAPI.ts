import axios, { AxiosResponse } from 'axios';
import { Logger } from 'homebridge';
import {
  createUponorAPIDataFromResponse,
  createEmptyUponorAPIData,
  UponorAPIData,
  UponorJNAPGetResponse,
  UponorJNAPSetPayload,
  UponorJNAPSetResponse,
} from './UponorAPIData';

const UponorActionHeaderName = 'x-jnap-action';
enum UponorActionHeaderValue {
  GET = 'http://phyn.com/jnap/uponorsky/GetAttributes',
  SET = 'http://phyn.com/jnap/uponorsky/SetAttributes',
}

export interface UponorAPI {
  getData: () => Promise<UponorAPIData>;
  setData: (payload: UponorJNAPSetPayload) => Promise<void>;
}

export const createUponorAPI = (log: Logger, host: string): UponorAPI => {
  const endpoint = `http://${host}/JNAP/`;

  const getData = async (): Promise<UponorAPIData> => {
    try {
      const result: AxiosResponse<UponorJNAPGetResponse> = await axios<UponorJNAPGetResponse>({
        method: 'post',
        url: endpoint,
        headers: { [UponorActionHeaderName]: UponorActionHeaderValue.GET },
        data: {},
        timeout: 5000,
      });
      if (result.data.result !== 'OK') {
        log.error('Error response from Uponor API:', result.data);
      }
      return createUponorAPIDataFromResponse(result.data);
    } catch (e) {
      if (e instanceof Error) {
        if ('code' in e && e.code === 'ECONNRESET') {
          log.warn(
            'Connection reset by Uponor API - the device may be busy or temporarily unavailable'
          );
        } else if ('code' in e && e.code === 'ECONNREFUSED') {
          log.error(
            'Connection refused by Uponor API - check if the device is online and the IP address is correct'
          );
        } else if ('code' in e && e.code === 'ETIMEDOUT') {
          log.warn('Connection to Uponor API timed out - the device may be slow or unreachable');
        } else {
          log.error('Error getting data from Uponor API:', e.message);
        }
      } else {
        log.error('Error getting data from Uponor API:', e);
      }
      return createEmptyUponorAPIData();
    }
  };

  const setData = async (payload: UponorJNAPSetPayload): Promise<void> => {
    try {
      const result: AxiosResponse<UponorJNAPSetResponse> = await axios<UponorJNAPSetResponse>({
        method: 'post',
        url: endpoint,
        headers: { [UponorActionHeaderName]: UponorActionHeaderValue.SET },
        data: payload,
        timeout: 5000,
      });
      if (result.data.result !== 'OK') {
        log.error('Error response from Uponor API:', result.data);
      }
    } catch (e) {
      if (e instanceof Error) {
        if ('code' in e && e.code === 'ECONNRESET') {
          log.warn('Connection reset by Uponor API while setting data - the device may be busy');
        } else if ('code' in e && e.code === 'ECONNREFUSED') {
          log.error('Connection refused by Uponor API - check if the device is online');
        } else if ('code' in e && e.code === 'ETIMEDOUT') {
          log.warn('Connection to Uponor API timed out while setting data');
        } else {
          log.error('Error setting data to Uponor API:', e.message);
        }
      } else {
        log.error('Error setting data to Uponor API:', e);
      }
    }
  };

  return {
    getData,
    setData,
  };
};
