/**
 * Whether a key press belongs to something the user is typing in.
 */
export const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * Whether a key press is a bare shortcut key, outside anything typed in.
 */
export const isBareKey = (event: KeyboardEvent, code: string): boolean =>
  event.code === code &&
  event.isTrusted &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.shiftKey &&
  !isTyping(event.target);
