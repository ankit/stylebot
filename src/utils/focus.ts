// Scripted focus that should look like keyboard focus, even when the key was
// pressed in another document (the Monaco iframe).
export const KEYBOARD_FOCUS: FocusOptions & { focusVisible: boolean } = {
  preventScroll: true,
  focusVisible: true,
};

/**
 * Whether keys pressed in the element are text entry, which single-key
 * shortcuts must leave alone.
 */
export const isFieldTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * Consumes an Escape pressed in a field for the innermost section handling it,
 * so the sections around it leave it alone.
 */
export const consumeFieldEscape = (event: KeyboardEvent): boolean => {
  if (event.defaultPrevented || !isFieldTarget(event.target)) {
    return false;
  }

  event.preventDefault();
  return true;
};
