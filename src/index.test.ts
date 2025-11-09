import indexModule from './index';
import { PLATFORM_NAME } from './settings';
import { UponorPlatform } from './platform';
import { API } from 'homebridge';

type MockAPI = {
  registerPlatform: ReturnType<typeof vi.fn>;
};

describe('index', () => {
  it('should export a function', () => {
    expect(typeof indexModule).toBe('function');
  });

  it('should register the platform with the API', () => {
    const mockApi: MockAPI = {
      registerPlatform: vi.fn(),
    };

    indexModule(mockApi as unknown as API);

    expect(mockApi.registerPlatform).toHaveBeenCalledTimes(1);
  });

  it('should register with correct platform name', () => {
    const mockApi: MockAPI = {
      registerPlatform: vi.fn(),
    };

    indexModule(mockApi as unknown as API);

    expect(mockApi.registerPlatform).toHaveBeenCalledWith(PLATFORM_NAME, UponorPlatform);
  });

  it('should use UponorPlatform class', () => {
    const mockApi: MockAPI = {
      registerPlatform: vi.fn(),
    };

    indexModule(mockApi as unknown as API);

    const [, platformClass] = mockApi.registerPlatform.mock.calls[0];

    expect(platformClass).toBe(UponorPlatform);
  });
});
