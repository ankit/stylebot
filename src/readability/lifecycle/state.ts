// Bumped on every applyReadability()/removeReadability() so a retry left
// over from a superseded attempt (e.g. the user toggled off while one was
// pending) is a no-op.
let generation = 0;

let pendingRetry: ReturnType<typeof setTimeout> | null = null;

/**
 * Bumps and returns the current generation, invalidating any prior one.
 */
export const nextGeneration = (): number => {
  generation++;
  return generation;
};

/**
 * Whether myGeneration has been superseded by a later applyReadability()/removeReadability() call.
 */
export const isStaleGeneration = (myGeneration: number): boolean =>
  myGeneration !== generation;

/**
 * Remembers the retry timer handle so a later removeReadability() can cancel it.
 */
export const setPendingRetry = (handle: ReturnType<typeof setTimeout>): void => {
  pendingRetry = handle;
};

/**
 * Cancels the pending retry timer, if any.
 */
export const clearPendingRetry = (): void => {
  if (pendingRetry !== null) {
    clearTimeout(pendingRetry);
    pendingRetry = null;
  }
};
