declare global {
  class EyeDropper {
    open(options?: { signal?: AbortSignal }): Promise<{ sRGBHex: string }>;
  }

  interface Window {
    EyeDropper?: typeof EyeDropper;
  }
}

export {};
