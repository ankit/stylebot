import { throttle } from './throttle';

describe('throttle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('runs the first call at once, then the last one per wait', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled(1);
    expect(fn).toBeCalledWith(1);

    throttled(2);
    throttled(3);
    expect(fn).toBeCalledTimes(1);

    jest.advanceTimersByTime(100);
    expect(fn).toBeCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3);
  });

  it('flush runs a pending call immediately, and only once', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled(1);
    throttled(2);
    throttled.flush();
    expect(fn).toHaveBeenLastCalledWith(2);

    jest.advanceTimersByTime(100);
    expect(fn).toBeCalledTimes(2);
  });

  it('cancel drops a pending call', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled(1);
    throttled(2);
    throttled.cancel();
    jest.advanceTimersByTime(100);

    expect(fn).toBeCalledTimes(1);
  });
});
