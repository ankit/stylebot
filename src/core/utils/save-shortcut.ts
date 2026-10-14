import { isMac } from './is-mac';

/**
 * Whether a keydown is the save shortcut: ⌘S on macOS, Ctrl+S elsewhere.
 */
export const isSaveShortcut = (
  event: KeyboardEvent,
  mac = isMac()
): boolean => {
  const modifier = mac ? event.metaKey : event.ctrlKey;
  const other = mac ? event.ctrlKey : event.metaKey;

  return (
    modifier &&
    !other &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === 's'
  );
};
