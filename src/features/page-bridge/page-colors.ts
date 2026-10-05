import type { RoleColorGroups } from '@stylebot/css';

const ROLE_CAP = 4;
const ALPHA_REGEX = /(?:^rgba\(.*,|\/)\s*([\d.]+)(%?)\s*\)$/i;

const isLaidOut = (el: Element): boolean => {
  const style = getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
};

const alphaOf = (color: string): number => {
  const match = ALPHA_REGEX.exec(color);
  if (!match) {
    return 1;
  }

  const alpha = parseFloat(match[1]);
  return match[2] ? alpha / 100 : alpha;
};

/**
 * Whether a computed color is fully opaque. A translucent one looks like
 * whatever was behind it, so applied elsewhere it wouldn't match the page.
 */
const isOpaque = (color: string): boolean => {
  return !!color && color !== 'transparent' && alphaOf(color) >= 1;
};

const topByFrequency = (counts: Map<string, number>): Array<string> => {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, ROLE_CAP)
    .map(([color]) => color);
};

const tally = (counts: Map<string, number>, color: string): void => {
  counts.set(color, (counts.get(color) || 0) + 1);
};

// Editor UI lives in its own open shadow root, so querySelectorAll('*') never samples it.
export const getPageColors = (root: ParentNode = document): RoleColorGroups => {
  const textCounts = new Map<string, number>();
  const surfaceCounts = new Map<string, number>();

  root.querySelectorAll('*').forEach(el => {
    if (!isLaidOut(el)) {
      return;
    }

    const style = getComputedStyle(el);

    if (isOpaque(style.color)) {
      tally(textCounts, style.color);
    }

    if (isOpaque(style.backgroundColor)) {
      tally(surfaceCounts, style.backgroundColor);
    }
  });

  const total = new Set([...textCounts.keys(), ...surfaceCounts.keys()]).size;

  return {
    text: topByFrequency(textCounts),
    surface: topByFrequency(surfaceCounts),
    total,
  };
};
