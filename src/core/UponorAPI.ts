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

  const handleApiError = (error: unknown, operation: 'get' | 'set'): void => {
    const operationText = operation === 'get' ? 'getting data from' : 'setting data to';
    const operationContext = operation === 'get' ? '' : ' while setting data';

    if (!(error instanceof Error)) {
      log.error(`Error ${operationText} Uponor API:`, error);
      return;
    }

    if ('code' in error && error.code === 'ECONNRESET') {
      log.warn(
        `Connection reset by Uponor API${operationContext} - the device may be busy${operation === 'get' ? ' or temporarily unavailable' : ''}`
      );
      return;
    }

    if ('code' in error && error.code === 'ECONNREFUSED') {
      log.error(
        `Connection refused by Uponor API - check if the device is online${operation === 'get' ? ' and the IP address is correct' : ''}`
      );
      return;
    }

    if ('code' in error && error.code === 'ETIMEDOUT') {
      log.warn(
        `Connection to Uponor API timed out${operationContext}${operation === 'get' ? ' - the device may be slow or unreachable' : ''}`
      );
      return;
    }

    log.error(`Error ${operationText} Uponor API:`, error.message);
  };

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
    } catch (error) {
      handleApiError(error, 'get');
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
    } catch (error) {
      handleApiError(error, 'set');
    }
  };

  return {
    getData,
    setData,
  };
};
