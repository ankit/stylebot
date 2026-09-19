export type Debounced<A extends Array<unknown>> = ((...args: A) => void) & {
  cancel: () => void;
};

/**
 * Delays calls to `fn` until `wait` ms have passed without another call;
 * the last arguments win. `cancel` drops a pending call.
 */
export const debounce = <A extends Array<unknown>>(
  fn: (...args: A) => void,
  wait: number
): Debounced<A> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  const debounced = (...args: A) => {
    cancel();
    timeoutId = setTimeout(() => fn(...args), wait);
  };

  debounced.cancel = cancel;

  return debounced;
};
