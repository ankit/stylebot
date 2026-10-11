declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props: Record<string, string> },
    ) => void;
  }
}

/**
 * Sends a custom event to Plausible. Does nothing in development, where the
 * script isn't loaded. Props should be stable keys, not localized text.
 */
export function track(event: string, props?: Record<string, string>) {
  window.plausible?.(event, props && { props });
}
