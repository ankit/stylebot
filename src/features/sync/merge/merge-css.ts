import { diff3Merge } from './diff3';

export type CssMergeResult = {
  css: string;
  // True when the losing side's lines had to be parked in a comment.
  conflicted: boolean;
};

const formatDate = (timestamp: string) => timestamp.slice(0, 10);

/**
 * Merges two edits of a stylesheet against the copy they both started from.
 * Hunks only one side touched apply as-is. Where both sides changed the same
 * lines, the winner's lines stay live and the loser's are appended inside a
 * comment — never as conflict markers, because this string is injected
 * straight into pages and a parse error would take the whole sheet down.
 */
export const mergeCss = (
  base: string,
  local: string,
  remote: string,
  localWins: boolean,
  at: string
): CssMergeResult => {
  const regions = diff3Merge(
    local.split('\n'),
    base.split('\n'),
    remote.split('\n')
  );

  const lines: Array<string> = [];
  const parked: Array<string> = [];

  regions.forEach(region => {
    if ('ok' in region) {
      lines.push(...region.ok);
      return;
    }

    const winner = localWins ? region.conflict.a : region.conflict.b;
    const loser = localWins ? region.conflict.b : region.conflict.a;

    lines.push(...winner);
    parked.push(...loser);
  });

  const preserved = parked.filter(line => line.trim() !== '');

  if (preserved.length === 0) {
    return { css: lines.join('\n'), conflicted: false };
  }

  const comment = [
    `/* Stylebot sync conflict on ${formatDate(at)}: another device had`,
    ...preserved.map(line => line.replace(/\*\//g, '* /')),
    '*/',
  ];

  const css = lines.join('\n').replace(/\s+$/, '');

  return {
    css: `${css}\n\n${comment.join('\n')}\n`,
    conflicted: true,
  };
};
