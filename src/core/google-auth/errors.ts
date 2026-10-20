export type GoogleAuthErrorCode = 'sign-in' | 'network';

export type GoogleAuthError = Error & { code: GoogleAuthErrorCode };

/**
 * A factory rather than an Error subclass: tsconfig sets no `target`, so
 * TypeScript emits ES3 and `class extends Error` silently breaks instanceof.
 */
export const googleAuthError = (
  message: string,
  code: GoogleAuthErrorCode
): GoogleAuthError => Object.assign(new Error(message), { code });

/**
 * Whether Google is overloaded or down for now, so trying again later will do.
 */
export const isUnavailable = (status: number): boolean =>
  status === 429 || status >= 500;
