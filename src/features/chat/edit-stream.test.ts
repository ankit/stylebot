import type { ChatCssEdit } from '@stylebot/types';

import { createEditStream } from './apply-css-tool';
import { createEditsExtractor } from './apply-css-tool/edit-stream';

const edits: Array<ChatCssEdit> = [
  {
    selector: '[class*="a,b"] > li:not(.x, .y)',
    declarations: [{ property: 'color', value: '#fff' }],
  },
  {
    selector: 'a[title="}{]["]::after',
    declarations: [
      { property: 'content', value: '"say \\"hi\\" \\\\ {}[],"' },
      { property: 'font-family', value: '"Fira Code", monospace' },
    ],
  },
  {
    selector: '.café > .日本',
    declarations: [{ property: 'content', value: '"→ ✓ 😀"' }],
  },
];

const input = JSON.stringify({ edits });

/**
 * Writes the chunks to a fresh edit stream and finishes it, noting each
 * edit reported along with the chunk it arrived on.
 */
const stream = (chunks: Array<string>) => {
  const reported: Array<{ edit: ChatCssEdit; chunk: number }> = [];
  let chunk = -1;
  const editStream = createEditStream(edit => reported.push({ edit, chunk }));

  chunks.forEach(text => {
    chunk++;
    editStream.write(text);
  });
  chunk = Infinity;

  return { reported, count: editStream.finish() };
};

describe('createEditsExtractor', () => {
  it('reports each entry once it closes, wherever the JSON is split', () => {
    for (let at = 0; at <= input.length; at++) {
      const entries: Array<string> = [];
      const extractor = createEditsExtractor(json => entries.push(json));

      extractor.write(input.slice(0, at));
      extractor.write(input.slice(at));

      expect(entries.map(entry => JSON.parse(entry))).toEqual(edits);
    }
  });

  it('reports nothing for an entry still open', () => {
    const entries: Array<string> = [];
    const extractor = createEditsExtractor(json => entries.push(json));
    const firstEnd = input.indexOf('}]}') + 3;

    extractor.write(input.slice(0, firstEnd - 1));
    expect(entries).toEqual([]);

    extractor.write(input.slice(firstEnd - 1, firstEnd));
    expect(entries.map(entry => JSON.parse(entry))).toEqual([edits[0]]);
  });

  it('only reads the top-level edits list, in whatever key order and spacing', () => {
    const entries: Array<string> = [];
    const extractor = createEditsExtractor(json => entries.push(json));
    const json = JSON.stringify(
      {
        text: 'Use "edits": [1, 2] like this',
        nested: { edits: [{ selector: 'no' }] },
        edits: [
          { declarations: [], selector: 'p' },
          'stray',
          { selector: 'h1', declarations: [] },
        ],
      },
      null,
      2
    );

    [...json].forEach(char => extractor.write(char));

    expect(entries.map(entry => JSON.parse(entry))).toEqual([
      { declarations: [], selector: 'p' },
      'stray',
      { selector: 'h1', declarations: [] },
    ]);
  });
});

describe('createEditStream', () => {
  it('reports each edit as its entry completes, one character at a time', () => {
    const { reported, count } = stream([...input]);

    expect(reported.map(({ edit }) => edit)).toEqual(edits);
    expect(reported.every(({ chunk }) => chunk < input.length - 2)).toBe(true);
    expect(count).toBe(3);
  });

  it('checks each edit as the whole call is checked', () => {
    const { reported, count } = stream([
      '{"edits":[{"selector":" .a ","declarations":[{"property":" color ","value":" red "}]},',
      '{"selector":".empty","declarations":[]},',
      '{"selector":"","declarations":[{"property":"color","value":"red"}]},',
      '{"selector":".b","declarations":[{"property":1,"value":"x"},{"property":"top","value":"0"}]}',
      ']}',
    ]);

    expect(reported).toEqual([
      {
        edit: {
          selector: '.a',
          declarations: [{ property: 'color', value: 'red' }],
        },
        chunk: 0,
      },
      {
        edit: {
          selector: '.b',
          declarations: [{ property: 'top', value: '0' }],
        },
        chunk: 3,
      },
    ]);
    expect(count).toBe(2);
  });

  it('keeps the edits read before a malformed tail, and reports the call broken', () => {
    const cut = input.indexOf('},{') + 1;
    const { reported, count } = stream([input.slice(0, cut), ',{"selec']);

    expect(reported.map(({ edit }) => edit)).toEqual([edits[0]]);
    expect(count).toBeNull();
  });

  it('reports arguments that arrive whole, and nothing twice once finished', () => {
    const { reported, count } = stream([input]);

    expect(reported.map(({ edit }) => edit)).toEqual(edits);
    expect(count).toBe(3);
  });

  it('makes no edits for an empty call', () => {
    expect(stream(['']).count).toBe(0);
    expect(stream(['{"edits":[]}']).count).toBe(0);
  });
});
