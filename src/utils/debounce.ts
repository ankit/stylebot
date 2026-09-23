export type Debounced<A extends Array<unknown>> = ((...args: A) => void) & {
  cancel: () => void;
  flush: () => void;
};

/**
 * Delays calls to `fn` until `wait` ms have passed without another call;
 * the last arguments win. `cancel` drops a pending call, `flush` runs it now.
 */
export const debounce = <A extends Array<unknown>>(
  fn: (...args: A) => void,
  wait: number
): Debounced<A> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let pendingArgs: A | undefined;

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
      fn(...args);
    }
  };

  const debounced = (...args: A) => {
    cancel();
    pendingArgs = args;
    timeoutId = setTimeout(flush, wait);
  };

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
};
