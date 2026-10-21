import { mockStorage } from './gallery.fixtures';
import {
  clearPublishRequest,
  getPublishRequest,
  requestPublishing,
} from './publish-request';

beforeEach(() => {
  jest.useFakeTimers({ now: 1_000_000 });
  mockStorage();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getPublishRequest', () => {
  it("gives the profile asked for on the style, until it's cleared", async () => {
    await requestPublishing('example.com', 'dark');

    expect(await getPublishRequest('example.com')).toBe('dark');

    await clearPublishRequest();

    expect(await getPublishRequest('example.com')).toBeNull();
  });

  it('leaves a request for another style alone', async () => {
    await requestPublishing('example.com', 'dark');

    expect(await getPublishRequest('other.com')).toBeNull();
    expect(await getPublishRequest('example.com')).toBe('dark');
  });

  it('drops a request that has gone stale', async () => {
    await requestPublishing('example.com', 'dark');
    jest.advanceTimersByTime(60_000);

    expect(await getPublishRequest('example.com')).toBeNull();
  });
});
