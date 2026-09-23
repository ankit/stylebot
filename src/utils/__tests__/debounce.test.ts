import { debounce } from '../debounce';

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('calls once with the last arguments after the wait', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced(1);
    debounced(2);
    jest.advanceTimersByTime(99);
    expect(fn).not.toBeCalled();

    jest.advanceTimersByTime(1);
    expect(fn).toBeCalledTimes(1);
    expect(fn).toBeCalledWith(2);
  });

  it('flush runs a pending call immediately, and only once', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced(1);
    debounced.flush();
    expect(fn).toBeCalledWith(1);

    jest.advanceTimersByTime(100);
    debounced.flush();
    expect(fn).toBeCalledTimes(1);
  });

  it('cancel drops a pending call', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced(1);
    debounced.cancel();
    debounced.flush();
    jest.advanceTimersByTime(100);

    expect(fn).not.toBeCalled();
  });
});
