export type Compound = {
  // The combinator joining it to the compound before, spaces included,
  // e.g. ' > ' or ' '; empty for the first.
  combinator: string;
  text: string;
};

const COMBINATORS = ['>', '+', '~'];
const HEX_ESCAPE = /^[0-9a-f]{1,6}\s?/i;

/**
 * One space for a descendant combinator, else the combinator spaced out.
 */
const formatCombinator = (joiner: string): string => {
  const symbol = joiner.replace(/\s/g, '');
  return symbol ? ` ${symbol} ` : ' ';
};

/**
 * Splits a selector into its compounds and the combinators between them,
 * e.g. `nav > ul a` into `nav`, ` > ul` and ` a`. Brackets, parens and
 * escapes (including a hex escape's trailing space) stay inside a compound.
 */
export const splitCompounds = (selector: string): Array<Compound> => {
  const compounds: Array<Compound> = [];
  let combinator = '';
  let text = '';
  let depth = 0;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];

    if (char === '\\') {
      const hex = selector.slice(i + 1).match(HEX_ESCAPE)?.[0];
      const escaped = hex ?? selector[i + 1] ?? '';
      text += char + escaped;
      i += escaped.length;
      continue;
    }

    if (depth === 0 && (char.trim() === '' || COMBINATORS.includes(char))) {
      if (text) {
        compounds.push({ combinator, text });
        combinator = '';
        text = '';
      }

      combinator += char.trim() === '' ? ' ' : char;
      continue;
    }

    if (char === '[' || char === '(') {
      depth++;
    } else if (char === ']' || char === ')') {
      depth--;
    }

    text += char;
  }

  if (text) {
    compounds.push({ combinator, text });
  }

  return compounds.map(({ combinator: joiner, text: compound }, i) => ({
    combinator: i === 0 ? '' : formatCombinator(joiner),
    text: compound,
  }));
};
