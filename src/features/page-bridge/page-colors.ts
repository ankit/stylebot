import type { RoleColorGroups } from '@stylebot/css';

const ROLE_CAP = 4;
const TRANSPARENT_REGEX = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/i;

const isLaidOut = (el: Element): boolean => {
  const style = getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
};

const isTransparent = (color: string): boolean => {
  return !color || color === 'transparent' || TRANSPARENT_REGEX.test(color);
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

    if (!isTransparent(style.color)) {
      tally(textCounts, style.color);
    }

    if (!isTransparent(style.backgroundColor)) {
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
