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
      });
      if (result.data.result !== 'OK') {
        log.error('Error response from Uponor API:', result.data);
      }
      return createUponorAPIDataFromResponse(result.data);
    } catch (e) {
      log.error('Error getting data from Uponor API:', e);
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
      });
      if (result.data.result !== 'OK') {
        log.error('Error response from Uponor API:', result.data);
      }
    } catch (e) {
      log.error('Error getting data from Uponor API:', e);
    }
  };

  return {
    getData,
    setData,
  };
};
