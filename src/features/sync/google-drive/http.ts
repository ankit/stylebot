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

const toErrorCode = (status: number): SyncErrorCode => {
  if (status === 401 || status === 403) {
    return 'auth';
  }

  return isUnavailable(status) ? 'network' : 'unknown';
};

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw syncError(
      `Google Drive API request failed (${response.status} ${response.statusText})`,
      toErrorCode(response.status)
    );
  }

  try {
    return await response.json();
  } catch {
    throw syncError('Google Drive returned invalid JSON', 'parse');
  }
};
