import { splitCommaList } from '../split-comma-list';

describe('splitCommaList', () => {
  it('splits on top-level commas and trims each member', () => {
    expect(splitCommaList(' h1 ,  .title,,p ')).toEqual(['h1', '.title', 'p']);
  });

  it('keeps commas inside quotes, parentheses and brackets', () => {
    expect(
      splitCommaList(
        'main [style*=\'background-color: rgb(238, 238, 238)\'], a:is(.x, .y), [title="a,b"]'
      )
    ).toEqual([
      "main [style*='background-color: rgb(238, 238, 238)']",
      'a:is(.x, .y)',
      '[title="a,b"]',
    ]);
  });

  it('keeps escaped commas and quotes', () => {
    expect(splitCommaList("a\\,b, [x='it\\'s, ok']")).toEqual([
      'a\\,b',
      "[x='it\\'s, ok']",
    ]);
  });

  it('keeps commas inside quoted font family names', () => {
    expect(splitCommaList('"Foo, Bar", serif')).toEqual([
      '"Foo, Bar"',
      'serif',
    ]);
  });
});
