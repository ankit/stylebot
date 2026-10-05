import { parseEdit, readEditsList } from './apply-css-tool/parse-edits';

describe('readEditsList', () => {
  it('returns null for broken JSON', () => {
    expect(readEditsList('{"edits":[{"sel')).toBeNull();
  });

  it('reads an empty call, or one without a list, as no edits', () => {
    expect(readEditsList('')).toEqual([]);
    expect(readEditsList('{"edits":"none"}')).toEqual([]);
  });
});

describe('parseEdit', () => {
  it('trims what fits the schema', () => {
    expect(
      parseEdit({
        selector: ' .a ',
        declarations: [{ property: ' color ', value: ' red ' }],
      })
    ).toEqual({
      selector: '.a',
      declarations: [{ property: 'color', value: 'red' }],
    });
  });

  it('drops declarations and edits that do not fit the schema', () => {
    expect(
      parseEdit({
        selector: '.b',
        declarations: [
          { property: 1, value: 'red' },
          { property: 'top', value: '0' },
        ],
      })
    ).toEqual({
      selector: '.b',
      declarations: [{ property: 'top', value: '0' }],
    });
    expect(
      parseEdit({
        selector: '',
        declarations: [{ property: 'color', value: 'red' }],
      })
    ).toBeNull();
    expect(parseEdit({ selector: '.c' })).toBeNull();
    expect(parseEdit('stray')).toBeNull();
  });
});
