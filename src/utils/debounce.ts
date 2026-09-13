export const debounce = (fn: () => void, wait: number): (() => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, wait);
  };
};
