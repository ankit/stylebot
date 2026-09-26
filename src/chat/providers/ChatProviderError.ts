import type { ChatErrorKey } from '@stylebot/types';

/**
 * A provider call that failed, as one of the chat's error keys plus the
 * provider's own message when it sent one.
 */
export class ChatProviderError extends Error {
  errorKey: ChatErrorKey;
  detail?: string;

  constructor(errorKey: ChatErrorKey, detail?: string) {
    super(detail ?? errorKey);
    this.errorKey = errorKey;
    this.detail = detail;
  }
}
