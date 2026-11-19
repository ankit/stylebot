import MonacoEditorIframe from './MonacoEditorIframe';

type Range = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
};

/**
 * A stand-in for Monaco's editor that holds plain text and reports every
 * change synchronously, as Monaco does.
 */
const createFakeEditor = () => {
  let value = '';
  const listeners: Array<() => void> = [];

  const getOffsetAt = (lineNumber: number, column: number) =>
    value
      .split('\n')
      .slice(0, lineNumber - 1)
      .reduce((offset, line) => offset + line.length + 1, column - 1);

  const change = (text: string) => {
    value = text;
    listeners.forEach(listener => listener());
  };

  return {
    type: change,
    editor: {
      onDidChangeModelContent: (listener: () => void) =>
        listeners.push(listener),
      getValue: () => value,
      setValue: change,
      executeEdits: (
        _source: string,
        [{ range, text }]: Array<{ range: Range; text: string }>
      ) =>
        change(
          value.slice(
            0,
            getOffsetAt(range.startLineNumber, range.startColumn)
          ) +
            text +
            value.slice(getOffsetAt(range.endLineNumber, range.endColumn))
        ),
      getModel: () => ({
        getValue: () => value,
        getPositionAt: (offset: number) => {
          const lines = value.slice(0, offset).split('\n');

          return {
            lineNumber: lines.length,
            column: lines[lines.length - 1].length + 1,
          };
        },
        findNextMatch: (regex: string) => {
          const lines = value.split('\n');
          const match = new RegExp(regex, 'm').exec(value);
          if (!match) {
            return null;
          }

          const endLineNumber = value
            .slice(0, match.index + match[0].length)
            .split('\n').length;

          return {
            range: {
              endLineNumber,
              endColumn: lines[endLineNumber - 1].length + 1,
            },
          };
        },
      }),
      getContribution: () => null,
      revealRangeInCenter: jest.fn(),
      setSelection: jest.fn(),
      pushUndoStop: jest.fn(),
      focus: jest.fn(),
      layout: jest.fn(),
      updateOptions: jest.fn(),
      deltaDecorations: () => [],
    },
  };
};

const sendCss = (css: string) =>
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'stylebotCssUpdate', css, focus: false },
    })
  );

describe('MonacoEditorIframe', () => {
  let fake: ReturnType<typeof createFakeEditor>;
  let posted: Array<{ type: string; css?: string }>;

  beforeEach(() => {
    fake = createFakeEditor();
    posted = [];
    document.body.innerHTML = '<div id="container"></div>';

    (global as unknown as { chrome: unknown }).chrome = {
      runtime: { getURL: (path: string) => path },
    };
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {
        //
      }
    };
    window.require = Object.assign(
      (_deps: Array<string>, callback: () => void) => callback(),
      { config: jest.fn() }
    );
    window.monaco = {
      editor: {
        create: () => fake.editor,
        defineTheme: jest.fn(),
        setTheme: jest.fn(),
      },
      languages: {
        css: {
          cssDefaults: {
            setDiagnosticsOptions: jest.fn(),
            setModeConfiguration: jest.fn(),
          },
        },
      },
    };
    jest
      .spyOn(MonacoEditorIframe.prototype, 'patchBlobWorkerLoading')
      .mockImplementation(() => undefined);
    jest
      .spyOn(window.parent, 'postMessage')
      .mockImplementation(message => posted.push(message));

    new MonacoEditorIframe();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const cssUpdates = () =>
    posted.filter(message => message.type === 'stylebotMonacoIframeCssUpdated');

  it("doesn't report the panel's css back as typing, which a late echo would apply over newer css", () => {
    sendCss('a { color: red; }');
    sendCss('a { color: red; } b { color: blue; }');

    expect(fake.editor.getValue()).toBe('a { color: red; } b { color: blue; }');
    expect(cssUpdates()).toEqual([]);
  });

  it('replaces only what the panel changed, so a folded header stays folded', () => {
    const header =
      '/* ==Stylebot==\n@var color c "Color" red\n==/Stylebot== */';
    const executeEdits = jest.spyOn(fake.editor, 'executeEdits');

    sendCss(`${header}\na { color: red; }`);
    sendCss(`${header}\na { color: blue; }`);

    expect(fake.editor.getValue()).toBe(`${header}\na { color: blue; }`);
    expect(executeEdits).toHaveBeenCalledWith('stylebot', [
      {
        range: {
          startLineNumber: 4,
          startColumn: 12,
          endLineNumber: 4,
          endColumn: 15,
        },
        text: 'blue',
      },
    ]);
  });

  it('reports what the user types', () => {
    sendCss('a { color: red; }');
    fake.type('a { color: blue; }');

    expect(cssUpdates()).toEqual([
      { type: 'stylebotMonacoIframeCssUpdated', css: 'a { color: blue; }' },
    ]);
  });

  describe('moving to the active rule', () => {
    const CSS = [
      'h1 {\n  color: red;\n}',
      'li:nth-child(1) > a {\n  \n}',
      '[class*="title_"] a {\n  \n}',
    ].join('\n\n');

    const selectRule = (selector: string) =>
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'stylebotCssUpdate', css: CSS, selector },
        })
      );

    it.each([
      ['h1', 2],
      ['li:nth-child(1) > a', 6],
      ['[class*="title_"] a', 10],
    ])('puts the caret inside %s', (selector, line) => {
      selectRule(selector);

      expect(fake.editor.setSelection).toHaveBeenCalledWith(
        expect.objectContaining({ startLineNumber: line })
      );
    });
  });

  describe('save shortcut', () => {
    const pressSave = () => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        cancelable: true,
      });
      jest.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
      window.dispatchEvent(event);
      return event;
    };

    const saves = () =>
      posted.filter(message => message.type === 'stylebotSavePressed');

    it("leaves the in-page editor's Ctrl+S to the browser", () => {
      const event = pressSave();

      expect(saves()).toEqual([]);
      expect(event.defaultPrevented).toBe(false);
    });

    it('asks the options page to save instead of the browser saving the page', () => {
      new MonacoEditorIframe('options');
      const event = pressSave();

      expect(saves()).toEqual([{ type: 'stylebotSavePressed' }]);
      expect(event.defaultPrevented).toBe(true);
    });
  });
});
