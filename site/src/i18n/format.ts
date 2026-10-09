const MAC_KEYS: Record<string, string> = { ctrl: 'cmd', alt: 'option' };

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Fills `{name}` placeholders in a message.
 */
export function fmt(message: string, vars: Record<string, string | number>) {
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * The markup `Keys.astro` renders for a key combination; `kbd[data-mac]`
 * lets its script swap in macOS key names.
 */
export function keysHtml(keys: string[], sep = '+') {
  const kbds = keys.map((key) => {
    const mac = MAC_KEYS[key] ? ` data-mac="${MAC_KEYS[key]}"` : '';
    return `<kbd${mac}>${escape(key)}</kbd>`;
  });
  return `<span class="keys">${kbds.join(
    `<span class="keys-sep">${escape(sep)}</span>`,
  )}</span>`;
}

/**
 * Renders a message that carries inline HTML (`<strong>`, `<a>`, `<code>`):
 * fills `{name}` placeholders, and turns `[[alt+shift+M]]` into key caps.
 */
export function rich(message: string, vars: Record<string, string> = {}) {
  return fmt(message, vars).replace(/\[\[(.+?)\]\]/g, (_, combo: string) =>
    keysHtml(combo === '+' ? ['+'] : combo.split('+')),
  );
}

/**
 * Splits a message around its `{name}` placeholders, so a page can render a
 * component in each one: `parts('Also on {a}')` → `['Also on ', '{a}', '']`.
 */
export function parts(message: string) {
  return message.split(/(\{\w+\})/);
}
