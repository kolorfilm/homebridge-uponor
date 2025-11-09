import axios from 'axios';
import { Logger } from 'homebridge';
import { createUponorAPI } from './UponorAPI';
import { UponorJNAPGetResponse, UponorJNAPSetPayload } from './UponorAPIData';

vi.mock('axios');

describe('UponorAPI', () => {
  let mockLogger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
      success: vi.fn(),
    } as unknown as Logger;
  });

  describe('createUponorAPI', () => {
    it('should create API instance', () => {
      const api = createUponorAPI(mockLogger, '192.168.1.100');

      expect(api).toBeDefined();
    });

    it('should have getData method', () => {
      const api = createUponorAPI(mockLogger, '192.168.1.100');

      expect(api.getData).toBeDefined();
    });

    it('should have setData method', () => {
      const api = createUponorAPI(mockLogger, '192.168.1.100');

      expect(api.setData).toBeDefined();
    });
  });

  describe('getData', () => {
    it('should make POST request with correct headers', async () => {
      const mockResponse: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [{ waspVarName: 'sys_controller_1_presence', waspVarValue: '1' }],
        },
      };

      (axios as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.getData();

      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://192.168.1.100/JNAP/',
        headers: { 'x-jnap-action': 'http://phyn.com/jnap/uponorsky/GetAttributes' },
        data: {},
        timeout: 5000,
      });
    });

    it('should return API data on success', async () => {
      const mockResponse: UponorJNAPGetResponse = {
        result: 'OK',
        output: {
          vars: [
            { waspVarName: 'sys_controller_1_presence', waspVarValue: '1' },
            { waspVarName: 'C1_thermostat_1_presence', waspVarValue: '1' },
          ],
        },
      };

      (axios as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      const data = await api.getData();
      const codes = await data.getDeviceCodes();

      expect(codes).toEqual(['C1_T1']);
    });

    it('should log error when response result is not OK', async () => {
      const mockResponse = {
        result: 'ERROR',
        output: { vars: [] },
      };

      (axios as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.getData();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error response from Uponor API:',
        mockResponse
      );
    });

    it('should return empty data on ECONNRESET error', async () => {
      const error = new Error('Connection reset');
      (error as Error & { code: string }).code = 'ECONNRESET';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      const data = await api.getData();
      const codes = await data.getDeviceCodes();

      expect(codes).toEqual([]);
    });

    it('should log warning on ECONNRESET error', async () => {
      const error = new Error('Connection reset');
      (error as Error & { code: string }).code = 'ECONNRESET';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.getData();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Connection reset by Uponor API - the device may be busy or temporarily unavailable'
      );
    });

    it('should return empty data on ECONNREFUSED error', async () => {
      const error = new Error('Connection refused');
      (error as Error & { code: string }).code = 'ECONNREFUSED';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      const data = await api.getData();
      const codes = await data.getDeviceCodes();

      expect(codes).toEqual([]);
    });

    it('should log error on ECONNREFUSED error', async () => {
      const error = new Error('Connection refused');
      (error as Error & { code: string }).code = 'ECONNREFUSED';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.getData();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Connection refused by Uponor API - check if the device is online and the IP address is correct'
      );
    });

    it('should return empty data on ETIMEDOUT error', async () => {
      const error = new Error('Connection timed out');
      (error as Error & { code: string }).code = 'ETIMEDOUT';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      const data = await api.getData();
      const codes = await data.getDeviceCodes();

      expect(codes).toEqual([]);
    });

    it('should log warning on ETIMEDOUT error', async () => {
      const error = new Error('Connection timed out');
      (error as Error & { code: string }).code = 'ETIMEDOUT';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.getData();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Connection to Uponor API timed out - the device may be slow or unreachable'
      );
    });

    it('should return empty data on generic error', async () => {
      const error = new Error('Generic error');

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      const data = await api.getData();
      const codes = await data.getDeviceCodes();

      expect(codes).toEqual([]);
    });

    it('should log error on generic error', async () => {
      const error = new Error('Generic error');

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.getData();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting data from Uponor API:',
        'Generic error'
      );
    });

    it('should handle non-Error objects', async () => {
      const error = 'String error';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.getData();

      expect(mockLogger.error).toHaveBeenCalledWith('Error getting data from Uponor API:', error);
    });
  });

  describe('setData', () => {
    it('should make POST request with correct headers', async () => {
      const mockResponse = {
        result: 'OK',
      };

      (axios as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

      const payload: UponorJNAPSetPayload = {
        vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
      };

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.setData(payload);

      expect(axios).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://192.168.1.100/JNAP/',
        headers: { 'x-jnap-action': 'http://phyn.com/jnap/uponorsky/SetAttributes' },
        data: payload,
        timeout: 5000,
      });
    });

    it('should complete successfully when response is OK', async () => {
      const mockResponse = {
        result: 'OK',
      };

      (axios as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

      const payload: UponorJNAPSetPayload = {
        vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
      };

      const api = createUponorAPI(mockLogger, '192.168.1.100');

      await expect(api.setData(payload)).resolves.toBeUndefined();
    });

    it('should log error when response result is not OK', async () => {
      const mockResponse = {
        result: 'ERROR',
      };

      (axios as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

      const payload: UponorJNAPSetPayload = {
        vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
      };

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.setData(payload);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error response from Uponor API:',
        mockResponse
      );
    });

    it('should log warning on ECONNRESET error', async () => {
      const error = new Error('Connection reset');
      (error as Error & { code: string }).code = 'ECONNRESET';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const payload: UponorJNAPSetPayload = {
        vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
      };

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.setData(payload);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Connection reset by Uponor API while setting data - the device may be busy'
      );
    });

    it('should log error on ECONNREFUSED error', async () => {
      const error = new Error('Connection refused');
      (error as Error & { code: string }).code = 'ECONNREFUSED';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const payload: UponorJNAPSetPayload = {
        vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
      };

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.setData(payload);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Connection refused by Uponor API - check if the device is online'
      );
    });

    it('should log warning on ETIMEDOUT error', async () => {
      const error = new Error('Connection timed out');
      (error as Error & { code: string }).code = 'ETIMEDOUT';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const payload: UponorJNAPSetPayload = {
        vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
      };

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.setData(payload);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Connection to Uponor API timed out while setting data'
      );
    });

    it('should log error on generic error', async () => {
      const error = new Error('Generic error');

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const payload: UponorJNAPSetPayload = {
        vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
      };

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.setData(payload);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error setting data to Uponor API:',
        'Generic error'
      );
    });

    it('should handle non-Error objects', async () => {
      const error = 'String error';

      (axios as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const payload: UponorJNAPSetPayload = {
        vars: [{ waspVarName: 'C1_T1_setpoint', waspVarValue: '698' }],
      };

      const api = createUponorAPI(mockLogger, '192.168.1.100');
      await api.setData(payload);

      expect(mockLogger.error).toHaveBeenCalledWith('Error setting data to Uponor API:', error);
    });
  });
});
