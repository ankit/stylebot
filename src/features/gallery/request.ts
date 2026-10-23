import { GALLERY_API_URL } from './config';

/**
 * status is the HTTP status, or 0 when the request never got an answer.
 */
export type GalleryApiError = Error & { status: number };

/**
 * A factory rather than an Error subclass: tsconfig sets no `target`, so
 * TypeScript emits ES3 and `class extends Error` silently breaks instanceof.
 */
export const galleryApiError = (
  message: string,
  status: number
): GalleryApiError => Object.assign(new Error(message), { status });

export const isGalleryApiError = (e: unknown): e is GalleryApiError =>
  e instanceof Error && typeof (e as GalleryApiError).status === 'number';

type RequestOptions = {
  method?: string;
  json?: unknown;
};

/**
 * Sends a request to the gallery API and resolves with its JSON, or nothing
 * for a 204. A failure rejects with the server's message and status.
 */
export const request = async <T>(
  path: string,
  { method = 'GET', json }: RequestOptions = {}
): Promise<T> => {
  const headers = new Headers();

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${GALLERY_API_URL}${path}`, {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch (e) {
    throw galleryApiError(e instanceof Error ? e.message : String(e), 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw galleryApiError(
      body?.error ?? `Gallery request failed (${response.status})`,
      response.status
    );
  }

  return body as T;
};
