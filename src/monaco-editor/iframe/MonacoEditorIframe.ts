/* eslint-disable @typescript-eslint/no-explicit-any */
import CustomLight from './themes/CustomLight';
import { IframeMessage, ParentUpdateCssMessage } from '@stylebot/monaco-editor';

declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}

class MonacEditorIframe {
  // todo: import monaco types
  editor?: any;

  constructor() {
    this.loadEditor(() => {
      this.attachWindowListeners();
      this.defineThemes();
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
  }

  getContainer(): HTMLDivElement {
    // DOM element is guaranteed to exist, so typecasting it.
    return document.getElementById('container') as HTMLDivElement;
  }

  getEditorOptions(): any {
    const container = this.getContainer();
    // todo: find a more robust / accurate way to compute;
    // might not work for some cases
    const wordWrapColumn = Math.round(container.offsetWidth / 8);

    return {
      value: '',
      tabSize: 2,
      theme: 'custom-light',
      wordWrap: 'bounded',
      wordWrapColumn,
      scrollBeyondLastLine: false,
      language: 'css',
      folding: false,
      renderLineHighlight: 'none',
      suggestOnTriggerCharacters: false,
      cursorBlinking: 'smooth',
      mouseWheelZoom: false,
      lineNumbers: 'off',
      minimap: {
        enabled: false,
      },
      hover: {
        enabled: false,
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
