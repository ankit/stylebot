import { syncError, type SyncErrorCode } from '../errors';
import type { AccessToken } from './get-access-token';

export const getAuthorizationHeaders = (accessToken: AccessToken): Headers =>
  new Headers({
    Authorization: `Bearer ${accessToken}`,
  });

/**
 * Whether Google is overloaded or down for now, so trying again later will do.
 */
export const isUnavailable = (status: number): boolean =>
  status === 429 || status >= 500;

const RATE_LIMIT_REASONS = ['rateLimitExceeded', 'userRateLimitExceeded'];

/**
 * Whether a 403 is Drive asking to slow down rather than turning the token
 * down, which it reports in the body's error reasons.
 */
const isRateLimited = async (response: Response): Promise<boolean> => {
  try {
    const { error } = await response.json();

    return (error?.errors ?? []).some((each: { reason?: string }) =>
      RATE_LIMIT_REASONS.includes(each?.reason ?? '')
    );
  } catch {
    return false;
  }
};

const getSyncErrorCode = async (response: Response): Promise<SyncErrorCode> => {
  const { status } = response;

  if (status === 403 && (await isRateLimited(response))) {
    return 'network';
  }

  if (status === 401 || status === 403) {
    return 'auth';
  }

  return isUnavailable(status) ? 'network' : 'unknown';
};

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw syncError(
      `Google Drive API request failed (${response.status} ${response.statusText})`,
      await getSyncErrorCode(response)
    );
  }

  try {
    return await response.json();
  } catch {
    throw syncError('Google Drive returned invalid JSON', 'parse');
  }
};
