/* eslint-disable @typescript-eslint/no-explicit-any */
import CustomLight from './themes/CustomLight';
import CustomDark from './themes/CustomDark';
import { IframeMessage, ParentUpdateCssMessage } from '@stylebot/monaco-editor';

declare global {
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

  constructor(variant: MonacoEditorVariant = 'default') {
    this.variant = variant;

    this.loadEditor(() => {
      this.attachWindowListeners();
      this.defineThemes();
      this.configureDiagnostics();
      this.initEditor();
      this.postMessage({ type: 'stylebotMonacoIframeLoaded' });
    });
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

  // The in-page editor doesn't support dark mode yet — defaults to light.
  getMonacoTheme(): 'custom-light' | 'custom-dark' {
    return new URLSearchParams(window.location.search).get('theme') === 'dark'
      ? 'custom-dark'
      : 'custom-light';
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
      ...wrapOptions,
      scrollBeyondLastLine: false,
      language: 'css',
      folding: false,
      renderLineHighlight: 'none',
      suggestOnTriggerCharacters: false,
      cursorBlinking: 'smooth',
      mouseWheelZoom: false,
      lineNumbers: isOptions ? 'on' : 'off',
      minimap: {
        enabled: false,
      },
      hover: {
        enabled: true,
      },
      codeLens: false,
    };
  }

  postMessage(message: IframeMessage): void {
    window.parent.postMessage(message, '*');
  }

  handleStylebotCssUpdate(css: string, selector?: string): void {
    this.editor.setValue(css);
    this.editor.focus();

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

    window.addEventListener(
      'message',
      (message: { data: ParentUpdateCssMessage }) => {
        if (message.data.type === 'stylebotCssUpdate') {
          this.handleStylebotCssUpdate(message.data.css, message.data.selector);
        }
      }
    );
  }
}

export default MonacEditorIframe;
