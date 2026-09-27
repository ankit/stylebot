declare global {
  class EyeDropper {
    open(options?: { signal?: AbortSignal }): Promise<{ sRGBHex: string }>;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    EyeDropper?: typeof EyeDropper;
  }
}

export {};
