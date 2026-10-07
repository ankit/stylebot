import MonacoEditorIframe from './MonacoEditorIframe';

/**
 * A stand-in for Monaco's editor that holds plain text and reports every
 * change synchronously, as Monaco does.
 */
const createFakeEditor = () => {
  let value = '';
  const listeners: Array<() => void> = [];

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
      executeEdits: (_source: string, edits: Array<{ text: string }>) =>
        change(edits[0].text),
      getModel: () => ({
        getValue: () => value,
        getFullModelRange: () => ({}),
        findNextMatch: () => null,
      }),
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

  it('reports what the user types', () => {
    sendCss('a { color: red; }');
    fake.type('a { color: blue; }');

    expect(cssUpdates()).toEqual([
      { type: 'stylebotMonacoIframeCssUpdated', css: 'a { color: blue; }' },
    ]);
  });
});
