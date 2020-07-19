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
      this.initializeEditor();
      this.postMessage({ type: 'stylebotMonacoIframeLoaded' });
    });
  }

  loadEditor(callback: () => void): void {
    window.require.config({
      paths: {
        vs: chrome.extension.getURL(
          'monaco-editor/iframe/node_modules/monaco-editor/min/vs'
        ),
      },
    });

    window.require(['vs/editor/editor.main'], callback);
  }

  initializeEditor(): void {
    const theme = 'custom-light';
    const container = document.getElementById('container');

    window.monaco.editor.defineTheme(theme, CustomLight);

    this.editor = window.monaco.editor.create(container, {
      theme,
      value: '',
      scrollBeyondLastLine: false,
      language: 'css',
      folding: true,
      cursorBlinking: 'smooth',
      dragAndDrop: true,
      mouseWheelZoom: true,
      wordWrap: 'on',
      minimap: {
        enabled: false,
      },
    });

    this.editor.getModel().updateOptions({ tabSize: 2 });

    this.editor.onDidChangeModelContent(() => {
      const css = this.editor.getValue();
      this.postMessage({ type: 'stylebotMonacoIframeCssUpdated', css });
    });
  }

  postMessage(message: IframeMessage): void {
    window.parent.postMessage(message, '*');
  }

  attachWindowListeners(): void {
    window.addEventListener('resize', () => {
      this.editor.layout();
    });

    window.addEventListener(
      'message',
      (message: { data: ParentUpdateCssMessage }) => {
        if (message.data.type === 'stylebotCssUpdate') {
          this.editor.setValue(message.data.css);
          this.editor.focus();
        }
      }
    );
  }
}

export default MonacEditorIframe;
