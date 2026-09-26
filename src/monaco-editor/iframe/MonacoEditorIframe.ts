/* eslint-disable @typescript-eslint/no-explicit-any */
import CustomLight from './themes/CustomLight';
import CustomDark from './themes/CustomDark';
import type { IframeMessage, ParentMessage } from '@stylebot/monaco-editor';

declare global {
  // Must stay an interface: augmenting Window relies on declaration merging.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    monaco: any;
    require: any;
  }
}

export type MonacoEditorVariant = 'default' | 'options';

class MonacEditorIframe {
  // todo: import monaco types
  editor?: any;
  variant: MonacoEditorVariant;
  // Whether the panel has sent its css yet; the first send seeds the
  // editor rather than being an edit the user could undo away.
  populated = false;

  constructor(variant: MonacoEditorVariant = 'default') {
    this.variant = variant;

    this.patchBlobWorkerLoading();
    this.loadEditor(() => {
      this.attachWindowListeners();
      this.defineThemes();
      this.configureDiagnostics();
      this.initEditor();
      this.postMessage({ type: 'stylebotMonacoIframeLoaded' });
    });
  }

  /**
   * Monaco's blob-wrapped worker URLs fail to `importScripts` a same-origin
   * extension URL (and Firefox's extension CSP blocks blob workers outright),
   * silently killing suggestions/color swatches.
   */
  patchBlobWorkerLoading(): void {
    const blobContents = new WeakMap<Blob, string>();
    const NativeBlob = window.Blob;

    // Plain functions, not `class extends`: ES5-downleveled classes can't extend natives.
    window.Blob = function (
      parts?: Array<BlobPart>,
      options?: BlobPropertyBag
    ): Blob {
      const blob = new NativeBlob(parts, options);
      if (parts?.every(part => typeof part === 'string')) {
        blobContents.set(blob, (parts as Array<string>).join(''));
      }
      return blob;
    } as unknown as typeof Blob;

    const realWorkerUrlsByBlobUrl = new Map<string, string>();
    const nativeCreateObjectURL = URL.createObjectURL.bind(URL);

    URL.createObjectURL = (blob: Blob): string => {
      const objectUrl = nativeCreateObjectURL(blob);
      const content = blobContents.get(blob);
      const match = content?.match(
        /importScripts\([^)]*?((?:chrome|moz)-extension:\/\/[^"')]+)/
      );

      if (match) {
        realWorkerUrlsByBlobUrl.set(objectUrl, match[1]);
      }

      return objectUrl;
    };

    const NativeWorker = window.Worker;

    window.Worker = function (
      scriptURL: string | URL,
      options?: WorkerOptions
    ): Worker {
      const requestedUrl =
        typeof scriptURL === 'string' ? scriptURL : scriptURL.href;
      const realUrl = realWorkerUrlsByBlobUrl.get(requestedUrl);

      return new NativeWorker(realUrl ?? scriptURL, options);
    } as unknown as typeof Worker;
  }

  loadEditor(callback: () => void): void {
    window.require.config({
      paths: {
        vs: chrome.runtime.getURL(
          'monaco-editor/iframe/node_modules/monaco-editor/min/vs'
        ),
      },
    });

    window.require(['vs/editor/editor.main'], callback);
  }

  defineThemes(): void {
    window.monaco.editor.defineTheme('custom-light', CustomLight);
    window.monaco.editor.defineTheme('custom-dark', CustomDark);
  }

  getMonacoTheme(): 'custom-light' | 'custom-dark' {
    return new URLSearchParams(window.location.search).get('theme') === 'dark'
      ? 'custom-dark'
      : 'custom-light';
  }

  setTheme(theme: 'light' | 'dark'): void {
    // Keeps the pre-Monaco-load background (see theme-init.js) in sync too,
    // in case the parent's theme changes again before the editor is ready.
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    window.monaco.editor.setTheme(
      theme === 'dark' ? 'custom-dark' : 'custom-light'
    );
  }

  configureDiagnostics(): void {
    // Both fire on normal Stylebot usage (empty rules on element pick,
    // single-browser vendor-prefixed hacks) rather than real mistakes.
    window.monaco.languages.css.cssDefaults.setDiagnosticsOptions({
      lint: { emptyRules: 'ignore', vendorPrefix: 'ignore' },
    });
  }

  initEditor(): void {
    const container = this.getContainer();
    const editorOptions = this.getEditorOptions();

    this.editor = window.monaco.editor.create(container, editorOptions);
    this.editor.onDidChangeModelContent(() => {
      this.postMessage({
        css: this.editor.getValue(),
        type: 'stylebotMonacoIframeCssUpdated',
      });
    });

    // Layout may still be settling at creation time — re-measure after paint.
    requestAnimationFrame(() => this.editor.layout());

    // Container can resize with no window resize event to catch it (e.g. dragging the
    // panel's edge) since it's same-document, not the iframe's own viewport.
    new ResizeObserver(() => this.editor.layout()).observe(container);
  }

  getContainer(): HTMLDivElement {
    // DOM element is guaranteed to exist, so typecasting it.
    return document.getElementById('container') as HTMLDivElement;
  }

  getEditorOptions(): any {
    const container = this.getContainer();
    // Options gets a full code-editor look (line numbers, soft-wrap); the
    // in-page panel keeps its original bounded word-wrap, no line numbers.
    const isOptions = this.variant === 'options';

    // 'on' wraps at the editor's actual width, avoiding a horizontal scrollbar.
    const wrapOptions = isOptions
      ? { wordWrap: 'on' as const }
      : {
          wordWrap: 'bounded' as const,
          // todo: find a more robust / accurate way to compute;
          // might not work for some cases
          wordWrapColumn: Math.round(container.offsetWidth / 8),
        };

    return {
      value: '',
      tabSize: 2,
      theme: this.getMonacoTheme(),
      fontFamily: "'Fira Code', Menlo, Monaco, Consolas, monospace",
      fontLigatures: true,
      ...wrapOptions,
      scrollBeyondLastLine: false,
      language: 'css',
      folding: false,
      renderLineHighlight: 'none',
      suggestOnTriggerCharacters: false,
      cursorBlinking: 'smooth',
      mouseWheelZoom: false,
      lineNumbers: isOptions ? 'on' : 'off',
      // Lets the scrollbar reach the container's true edges instead of an
      // outer CSS padding clipping it; no horizontal equivalent in Monaco.
      padding: isOptions ? { top: 14, bottom: 18 } : undefined,
      minimap: {
        enabled: false,
      },
      hover: {
        enabled: true,
      },
      codeLens: false,
      // Tab indents only where Escape leaves the editor (the panel); elsewhere
      // it would trap focus, since macOS swallows the Ctrl+M toggle in-browser.
      tabFocusMode: isOptions,
    };
  }

  postMessage(message: IframeMessage): void {
    window.parent.postMessage(message, '*');
  }

  /**
   * Applies the panel's css as an undoable edit, since setValue would reset
   * Monaco's own history.
   */
  handleStylebotCssUpdate(css: string, selector?: string, focus = true): void {
    const model = this.editor.getModel();

    if (!this.populated) {
      this.populated = true;
      this.editor.setValue(css);
    } else if (model.getValue() !== css) {
      this.editor.pushUndoStop();
      this.editor.executeEdits('stylebot', [
        { range: model.getFullModelRange(), text: css },
      ]);
      this.editor.pushUndoStop();
    }

    if (focus) {
      this.editor.focus();
    }

    if (selector) {
      const regex = `^${selector}\\s\\{\\n\\s*(?!\\}).*$`;
      const match = this.editor.getModel().findNextMatch(
        regex,
        {
          column: 1,
          lineNumber: 1,
        },
        true
      );

      if (match) {
        // setSelection alone doesn't scroll the matched line into view if
        // it's off-screen — reveal it explicitly, centered.
        this.editor.revealRangeInCenter(match.range);
        this.editor.setSelection({
          startColumn: match.range.endColumn,
          startLineNumber: match.range.endLineNumber,
          endColumn: match.range.endColumn,
          endLineNumber: match.range.endLineNumber,
        });
      }
    }
  }

  attachWindowListeners(): void {
    window.addEventListener('resize', () => {
      this.editor.layout();
      this.editor.updateOptions(this.getEditorOptions());
    });

    // The parent's Escape listener never sees this — separate document. Monaco stops propagation when it handles Escape internally.
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        this.postMessage({ type: 'stylebotEscapePressed' });
      }
    });

    window.addEventListener('message', (message: { data: ParentMessage }) => {
      if (message.data.type === 'stylebotCssUpdate') {
        this.handleStylebotCssUpdate(
          message.data.css,
          message.data.selector,
          message.data.focus ?? true
        );
      } else if (message.data.type === 'stylebotFocusEditor') {
        this.editor.focus();
      } else if (message.data.type === 'stylebotThemeUpdate') {
        this.setTheme(message.data.theme);
      }
    });
  }
}

export default MonacEditorIframe;
