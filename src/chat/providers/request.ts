import type { ChatErrorKey, ChatStreamEvent } from '@stylebot/types';

import { ChatProviderError } from './ChatProviderError';

const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * The error key for a failed HTTP response from a provider.
 */
export const errorKeyForStatus = (status: number): ChatErrorKey => {
  if (status === 401 || status === 403) {
    return 'chat_error_invalid_key';
  }

  if (status === 429) {
    return 'chat_error_rate_limited';
  }

  return 'chat_error_provider';
};

/**
 * The provider's own error message from a failed response, if it sent one.
 */
export const readErrorDetail = async (
  response: Response
): Promise<string | undefined> => {
  try {
    const body = await response.json();
    // Some providers (Gemini) wrap the error object in an array.
    const message = (Array.isArray(body) ? body[0] : body)?.error?.message;
    return isString(message) ? message : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Reads a failed response as one of the error keys, for providers whose
 * statuses don't follow the usual meanings; undefined falls back to them.
 */
export type ClassifyError = (
  status: number,
  detail: string | undefined
) => ChatErrorKey | undefined;

/**
 * Fetches from a provider, turning a failed response or a network failure
 * into a ChatProviderError.
 */
export const providerFetch = async (
  url: string,
  init: RequestInit,
  classify?: ClassifyError
): Promise<Response> => {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw e;
    }
    throw new ChatProviderError(
      'chat_error_network',
      e instanceof Error ? e.message : undefined
    );
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);

    throw new ChatProviderError(
      classify?.(response.status, detail) ?? errorKeyForStatus(response.status),
      detail
    );
  }

  return response;
};

/**
 * Runs a stream, reporting any failure as an error event; a cancelled
 * stream ends quietly, since nobody is listening any more.
 */
export const runStream = async (
  signal: AbortSignal,
  onEvent: (event: ChatStreamEvent) => void,
  work: () => Promise<void>
): Promise<void> => {
  try {
    await work();
  } catch (e) {
    if (signal.aborted) {
      return;
    }

    // Left in the background's console, where a failed reply can be traced.
    console.warn('Stylebot chat: reply failed', e);

    if (e instanceof ChatProviderError) {
      onEvent({ type: 'error', errorKey: e.errorKey, detail: e.detail });
    } else {
      // A TypeError here is the connection dropping mid-reply.
      onEvent({
        type: 'error',
        errorKey:
          e instanceof TypeError ? 'chat_error_network' : 'chat_error_provider',
        detail: e instanceof Error ? e.message : undefined,
      });
    }
  }
};
