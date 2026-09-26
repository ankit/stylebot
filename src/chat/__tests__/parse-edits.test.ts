import { parseEdits } from '../apply-css-tool';

describe('parseEdits', () => {
  it('returns null for broken JSON', () => {
    expect(parseEdits('{"edits":[{"sel')).toBeNull();
  });

  it('drops edits that do not fit the schema', () => {
    expect(
      parseEdits(
        JSON.stringify({
          edits: [
            {
              selector: ' .a ',
              declarations: [{ property: 'color', value: 'red' }],
            },
            {
              selector: '',
              declarations: [{ property: 'color', value: 'red' }],
            },
            { selector: '.b', declarations: [{ property: 1, value: 'red' }] },
            { selector: '.c' },
          ],
        })
      )
    ).toEqual([
      { selector: '.a', declarations: [{ property: 'color', value: 'red' }] },
    ]);
  });
});
