import type { Debounced } from './debounce';

/**
 * Calls `fn` at most once every `wait` ms while calls keep coming, with the
 * last arguments; the first call runs at once. `flush` runs a pending call
 * now, `cancel` drops it.
 */
export const throttle = <A extends Array<unknown>>(
  fn: (...args: A) => void,
  wait = 100
): Debounced<A> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let pendingArgs: A | undefined;
  let lastCall = -Infinity;

  const cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    pendingArgs = undefined;
  };

  const flush = () => {
    const args = pendingArgs;
    cancel();

    if (args) {
      lastCall = Date.now();
      fn(...args);
    }
  };

  const throttled = (...args: A) => {
    pendingArgs = args;

    if (Date.now() - lastCall >= wait) {
      flush();
    } else if (timeoutId === undefined) {
      timeoutId = setTimeout(flush, wait - (Date.now() - lastCall));
    }
  };

  throttled.cancel = cancel;
  throttled.flush = flush;

  return throttled;
};
