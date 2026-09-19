import {
  getPrimaryFontFamily,
  getTokenAtCaret,
  quoteFamily,
  replaceToken,
  unquoteFamily,
} from '../font-family';

describe('getTokenAtCaret', () => {
  it('returns the whole value when there are no commas', () => {
    expect(getTokenAtCaret('Lora', 2)).toEqual({
      start: 0,
      end: 4,
      value: 'Lora',
    });
  });

  it('finds the segment containing the caret', () => {
    const text = '"Playfair Display", Georgia, serif';

    expect(getTokenAtCaret(text, 24)).toEqual({
      start: 19,
      end: 27,
      value: 'Georgia',
    });
  });

  it('strips quotes and whitespace from the value', () => {
    expect(getTokenAtCaret('"Playfair Display", serif', 5).value).toBe(
      'Playfair Display'
    );
  });

  it('treats the text after a trailing comma as an empty token', () => {
    expect(getTokenAtCaret('Lora, ', 6)).toEqual({
      start: 5,
      end: 6,
      value: '',
    });
  });

  it('clamps the caret to the text bounds', () => {
    expect(getTokenAtCaret('Lora, serif', 99).value).toBe('serif');
  });
});

describe('replaceToken', () => {
  it('replaces the segment and keeps the rest of the stack', () => {
    const text = 'Lora, Georgia, serif';
    const token = getTokenAtCaret(text, 8);

    expect(replaceToken(text, token, 'Merriweather')).toBe(
      'Lora, Merriweather, serif'
    );
  });

  it('keeps the space after the preceding comma', () => {
    const text = 'Lora, ';
    const token = getTokenAtCaret(text, 6);

    expect(replaceToken(text, token, 'Merriweather')).toBe(
      'Lora, Merriweather'
    );
  });

  it('adds a space when the comma has none', () => {
    const text = 'Lora,';
    const token = getTokenAtCaret(text, 5);

    expect(replaceToken(text, token, 'Merriweather')).toBe(
      'Lora, Merriweather'
    );
  });

  it('replaces a quoted family', () => {
    const text = '"Playfair Display", serif';
    const token = getTokenAtCaret(text, 3);

    expect(replaceToken(text, token, 'Lora')).toBe('Lora, serif');
  });

  it('quotes a multi-word family only inside a stack', () => {
    const stack = 'Lora, ';

    expect(
      replaceToken(stack, getTokenAtCaret(stack, 6), 'Playfair Display')
    ).toBe('Lora, "Playfair Display"');
    expect(
      replaceToken('playf', getTokenAtCaret('playf', 5), 'Playfair Display')
    ).toBe('Playfair Display');
  });
});

describe('quoteFamily', () => {
  it('quotes only names with spaces', () => {
    expect(quoteFamily('Lora')).toBe('Lora');
    expect(quoteFamily('Playfair Display')).toBe('"Playfair Display"');
  });
});

describe('unquoteFamily', () => {
  it('strips surrounding quotes only', () => {
    expect(unquoteFamily('"Fira Code"')).toBe('Fira Code');
    expect(unquoteFamily("'Lora'")).toBe('Lora');
    expect(unquoteFamily('Inter')).toBe('Inter');
  });
});

describe('getPrimaryFontFamily', () => {
  it('returns a single family unchanged', () => {
    expect(getPrimaryFontFamily('Muli')).toBe('Muli');
  });

  it('returns the first family of a stack, unquoted', () => {
    expect(getPrimaryFontFamily('"Playfair Display", Georgia, serif')).toBe(
      'Playfair Display'
    );
    expect(getPrimaryFontFamily("'Lora' , serif")).toBe('Lora');
  });

  it('returns an empty string for an empty value', () => {
    expect(getPrimaryFontFamily('   ')).toBe('');
  });
});
