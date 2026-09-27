import { syncError } from '../errors';
import type { AccessToken } from './get-access-token';

export const getAuthorizationHeaders = (accessToken: AccessToken): Headers =>
  new Headers({
    Authorization: `Bearer ${accessToken}`,
  });

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw syncError(
      `Google Drive API request failed (${response.status} ${response.statusText})`,
      response.status === 401 || response.status === 403 ? 'auth' : 'unknown'
    );
  }

  try {
    return await response.json();
  } catch {
    throw syncError('Google Drive returned invalid JSON', 'parse');
  }
};
