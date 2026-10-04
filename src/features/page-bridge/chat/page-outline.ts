const MAX_LINES = 400;
const MAX_CHARS = 16000;
const MAX_TEXT = 40;
const MAX_CLASSES = 4;
// Siblings of the same kind past this many are summarised, alternating
// ones too (a story's title row, subtext row, spacer).
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

// A named id makes an element unique, so it's never folded into a run;
// numbered ones (a post's id) mark items of a list, which still fold.
const ownSignature = (element: Element): string =>
  [
    element.tagName,
    /\d/.test(element.id) ? '' : element.id,
    ...classesOf(element),
  ].join('.');

// Its first few children tell apart plain siblings that hold different
// things, like a list's rows and the "More" row after them.
const signatureOf = (element: Element): string =>
  [
    ownSignature(element),
    ...Array.from(element.children).slice(0, 3).map(ownSignature),
  ].join('>');

const ownText = (element: Element): string => {
  const text = Array.from(element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
};

const shortSize = (value: string): string =>
  `${Math.round(parseFloat(value) * 10) / 10}px`;

const hex = (channel: string): string =>
  Math.round(Number(channel)).toString(16).padStart(2, '0');

/**
 * A computed color as hex (with alpha when it isn't opaque), or null when
 * it's fully transparent. Other color spaces are kept as written.
 */
const shortColor = (value: string): string | null => {
  const rgb =
    /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(value);

  if (!rgb) {
    return value && value !== 'transparent' ? value : null;
  }

  const [, r, g, b, a = '1'] = rgb;
  const alpha = Number(a);

  if (alpha === 0) {
    return null;
  }

  return `#${hex(r)}${hex(g)}${hex(b)}${
    alpha < 1 ? hex(String(alpha * 255)) : ''
  }`;
};

/**
 * What the element looks like where it differs from its parent: its own
 * background, and the text color and size it changes. Backgrounds aren't
 * inherited, so any is worth naming.
 */
const styleHints = (element: Element): Array<string> => {
  const style = getComputedStyle(element);
  const parent = element.parentElement
    ? getComputedStyle(element.parentElement)
    : null;
  const hints: Array<string> = [];
  const background = shortColor(style.backgroundColor);

  if (background) {
    hints.push(`bg ${background}`);
  }

  if (style.backgroundImage && style.backgroundImage !== 'none') {
    hints.push('bg-image');
  }

  if (style.color && style.color !== parent?.color) {
    const color = shortColor(style.color);

    if (color) {
      hints.push(`color ${color}`);
    }
  }

  if (style.fontSize && style.fontSize !== parent?.fontSize) {
    hints.push(`font ${shortSize(style.fontSize)}`);
  }

  return hints;
};

// Old-style pages color elements with this attribute, often their only
// selectable trait (a table cell with no class).
const bgcolorOf = (element: Element): string => {
  const value = element.getAttribute('bgcolor');
  return value ? `[bgcolor="${value.replace(/"/g, '')}"]` : '';
};

const describe = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = classesOf(element)
    .map(name => `.${name}`)
    .join('');
  const text = ownText(element);
  const hints = styleHints(element);

  return `${tag}${id}${classes}${bgcolorOf(element)}${
    text ? ` "${text}"` : ''
  }${hints.length ? ` [${hints.join(', ')}]` : ''}`;
};

/**
 * The page's base look, from body (or html, when body has no background of
 * its own), which the outline's hints are relative to.
 */
const pageHints = (): string => {
  const body = getComputedStyle(document.body);
  const background =
    shortColor(body.backgroundColor) ??
    shortColor(getComputedStyle(document.documentElement).backgroundColor);
  const color = shortColor(body.color);
  const hints = [
    background ? `bg ${background}` : '',
    color ? `color ${color}` : '',
    body.fontSize ? `font ${shortSize(body.fontSize)}` : '',
  ].filter(Boolean);

  return hints.length ? `(page) [${hints.join(', ')}]` : '';
};

// Anonymous wrappers add depth, not information; their children are listed
// in their place.
const isBareWrapper = (element: Element): boolean =>
  (element.tagName === 'DIV' || element.tagName === 'SPAN') &&
  !element.id &&
  !element.classList.length &&
  !ownText(element);

/**
 * An indented outline of the page's visible elements (tag, id, classes, a
 * snippet of their own text, and how they look where that differs from
 * their parent), for the model to pick selectors from. Kept to a budget;
 * long runs of alike siblings are summarised.
 */
export const getPageOutline = (): string => {
  const lines: Array<string> = [];
  let chars = 0;
  const page = pageHints();

  if (page) {
    lines.push(page);
    chars += page.length + 1;
  }

  const push = (line: string): boolean => {
    if (lines.length >= MAX_LINES || chars + line.length > MAX_CHARS) {
      return false;
    }
    lines.push(line);
    chars += line.length + 1;
    return true;
  };

  const walk = (parent: Element, depth: number): boolean => {
    const seen = new Map<string, number>();
    let skipped = 0;

    const flushSkipped = (): boolean => {
      const count = skipped;
      skipped = 0;
      return count ? push(`${'  '.repeat(depth)}… ×${count} more`) : true;
    };

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
      const count = (seen.get(signature) ?? 0) + 1;
      seen.set(signature, count);

      if (count > MAX_REPEATS) {
        skipped++;
        continue;
      }

      if (!flushSkipped() || !push(`${'  '.repeat(depth)}${describe(child)}`)) {
        return false;
      }

      if (!OPAQUE_TAGS.has(child.tagName) && !walk(child, depth + 1)) {
        return false;
      }
    }

    return flushSkipped();
  };

  if (!walk(document.body, 0)) {
    lines.push('… (outline truncated)');
  }

  return lines.join('\n');
};
