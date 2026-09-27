const MAX_LINES = 400;
const MAX_CHARS = 12000;
const MAX_TEXT = 40;
const MAX_CLASSES = 4;
// Siblings with the same tag and classes past this many are summarised.
const MAX_REPEATS = 2;

const SKIPPED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'LINK',
  'META',
  'HEAD',
  'BR',
  'WBR',
]);

// Their insides are drawing or foreign documents, not page structure.
const OPAQUE_TAGS = new Set(['svg', 'IFRAME', 'VIDEO', 'CANVAS', 'PICTURE']);

const isVisible = (element: Element): boolean => {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility();
  }

  return getComputedStyle(element).display !== 'none';
};

const classesOf = (element: Element): Array<string> =>
  Array.from(element.classList)
    .filter(name => name.length <= 30)
    .slice(0, MAX_CLASSES);

const signatureOf = (element: Element): string =>
  [element.tagName, ...classesOf(element)].join('.');

const ownText = (element: Element): string => {
  const text = Array.from(element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
};

const describe = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = classesOf(element)
    .map(name => `.${name}`)
    .join('');
  const text = ownText(element);

  return `${tag}${id}${classes}${text ? ` "${text}"` : ''}`;
};

// Anonymous wrappers add depth, not information; their children are listed
// in their place.
const isBareWrapper = (element: Element): boolean =>
  (element.tagName === 'DIV' || element.tagName === 'SPAN') &&
  !element.id &&
  !element.classList.length &&
  !ownText(element);

/**
 * An indented outline of the page's visible elements (tag, id, classes and
 * a snippet of their own text), for the model to pick selectors from. Kept
 * to a budget; long runs of alike siblings are summarised.
 */
export const getPageOutline = (): string => {
  const lines: Array<string> = [];
  let chars = 0;

  const push = (line: string): boolean => {
    if (lines.length >= MAX_LINES || chars + line.length > MAX_CHARS) {
      return false;
    }
    lines.push(line);
    chars += line.length + 1;
    return true;
  };

  const walk = (parent: Element, depth: number): boolean => {
    let previous = '';
    let repeats = 0;

    const flushRepeats = (): boolean =>
      repeats > MAX_REPEATS
        ? push(`${'  '.repeat(depth)}… ×${repeats - MAX_REPEATS} more`)
        : true;

    for (const child of Array.from(parent.children)) {
      if (
        SKIPPED_TAGS.has(child.tagName) ||
        child.id === 'stylebot' ||
        !isVisible(child)
      ) {
        continue;
      }

      if (isBareWrapper(child)) {
        if (!walk(child, depth)) {
          return false;
        }
        continue;
      }

      const signature = signatureOf(child);

      if (signature === previous) {
        repeats++;
        if (repeats > MAX_REPEATS) {
          continue;
        }
      } else {
        if (!flushRepeats()) {
          return false;
        }
        previous = signature;
        repeats = 1;
      }

      if (!push(`${'  '.repeat(depth)}${describe(child)}`)) {
        return false;
      }

      if (!OPAQUE_TAGS.has(child.tagName) && !walk(child, depth + 1)) {
        return false;
      }
    }

    return flushRepeats();
  };

  if (!walk(document.body, 0)) {
    lines.push('… (outline truncated)');
  }

  return lines.join('\n');
};
