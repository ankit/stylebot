/**
 * Terminal styling for the CLI's help and `install`, and the extension's
 * icon drawn in text.
 */
export const bold = text => `\x1b[1m${text}\x1b[22m`;
export const dim = text => `\x1b[2m${text}\x1b[22m`;

export const rgb = (hex, text) => {
  const [r, g, b] = hex.match(/\w\w/g).map(pair => parseInt(pair, 16));
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
};

export const PINK = '#ec4d86';
export const BLUE = '#1c9fc4';
export const YELLOW = '#e0a218';
export const CURSOR = '#2563eb';

/**
 * The extension's icon, its three bars and cursor, beside a title and a
 * line under it.
 */
export const banner = (title, subtitle) => [
  '',
  `  ${rgb(PINK, '▀'.repeat(16))}`,
  `  ${rgb(BLUE, '▀'.repeat(11))}         ${bold(title)}`,
  `  ${rgb(YELLOW, '▀'.repeat(13))} ${rgb(CURSOR, '▌')}     ${dim(subtitle)}`,
];

/**
 * Makes each stylebot.dev address in text a link terminals can open, as
 * an OSC 8 hyperlink; terminals without them show the text as it was.
 */
export const linkify = text =>
  text.replace(
    /stylebot\.dev(\/[\w-]+)?/g,
    address => `\x1b]8;;https://${address}\x1b\\${address}\x1b]8;;\x1b\\`
  );

/**
 * Whether a stream is a terminal that wants styling.
 */
export const isStyled = stream =>
  Boolean(stream.isTTY) && !process.env.NO_COLOR;
