/* Firefox lets an extension change its shortcuts and open its page for them; Chrome has neither. */
declare namespace chrome.commands {
  export const update:
    | ((detail: { name: string; shortcut?: string }) => Promise<void>)
    | undefined;

  export const openShortcutSettings: (() => Promise<void>) | undefined;
}
