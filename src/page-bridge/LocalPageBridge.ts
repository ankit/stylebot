import {
  injectCSSIntoDocument,
  removeCSSFromDocument,
  removeEmptyRules,
  validateSelector,
  getDeclarationsForSelector,
  getExistingSelector,
  getBodyChildSelectors,
  RoleColorGroups,
} from '@stylebot/css';
import { Highlighter } from '@stylebot/highlighter';
import {
  applyReadability,
  removeReadability,
  isReaderable,
} from '@stylebot/readability';

import { readCache, writeCache } from '../inject-css/cache';

import { PageBridge, PageSnapshot } from './PageBridge';
import { PageBridgeEmitter } from './PageBridgeEmitter';
import { getPageColors } from './page-colors';
import { getComputedStyles } from './computed-styles';

const PREVIEW_ID = 'font-preview';

/**
 * The editor's theme-provider element, for the highlighter's tip to inherit
 * the theme. Storybook renders it in the light DOM under the same host id.
 */
const getMountRoot = (): HTMLElement | undefined => {
  const host = document.getElementById('stylebot');
  const root = host?.shadowRoot ?? host;

  return root?.querySelector<HTMLElement>('.stylebot-app') ?? undefined;
};

/**
 * Talks to the document the editor script runs in. Previews and inspecting
 * use separate highlighters so clearing one can't tear down the other.
 */
export class LocalPageBridge extends PageBridgeEmitter implements PageBridge {
  private inspector: Highlighter;
  private previewer: Highlighter;

  constructor({ getStylebotCss }: { getStylebotCss: () => string }) {
    super();

    const getStylebotDeclarations = (selector: string) =>
      getDeclarationsForSelector(getStylebotCss(), selector);

    this.inspector = new Highlighter({
      onSelect: selector => this.emit('select', selector),
      getStylebotDeclarations,
      getExistingSelector: el => getExistingSelector(el, getStylebotCss()),
      getMountRoot,
    });

    this.previewer = new Highlighter({
      onSelect: () => undefined,
      getStylebotDeclarations,
      getMountRoot,
    });
  }

  getSnapshotSync(): PageSnapshot {
    return {
      domain: document.domain,
      href: window.location.href,
      title: document.title,
      readerable: isReaderable(),
      bodyChildSelectors: getBodyChildSelectors(),
    };
  }

  getSnapshot(): Promise<PageSnapshot> {
    return Promise.resolve(this.getSnapshotSync());
  }

  applyCss({
    url,
    css,
    enabled,
    forceImportant,
  }: {
    url: string;
    css: string;
    enabled: boolean;
    forceImportant: boolean;
  }): void {
    injectCSSIntoDocument(css, url, { forceImportant });

    // The localStorage cache is applied on the next load before storage
    // resolves; keep it current so a quick reload doesn't flash old CSS.
    const cached = readCache();
    if (cached) {
      const entry = {
        url,
        css: removeEmptyRules(css),
        enabled,
        forceImportant,
      };
      const exists = cached.styles.some(style => style.url === url);

      writeCache({
        ...cached,
        styles: exists
          ? cached.styles.map(style => (style.url === url ? entry : style))
          : [...cached.styles, entry],
      });
    }
  }

  setPreviewCss(
    preview: { css: string; forceImportant: boolean } | null
  ): void {
    if (preview === null) {
      removeCSSFromDocument(PREVIEW_ID);
    } else {
      injectCSSIntoDocument(preview.css, PREVIEW_ID, {
        forceImportant: preview.forceImportant,
      });
    }
  }

  applyReadability(value: boolean): void {
    if (value) {
      applyReadability(true);
    } else {
      removeReadability();
    }

    // Keep the localStorage cache in sync so a refresh right after
    // toggling doesn't apply the stale readability state.
    const cached = readCache();
    if (cached) {
      writeCache({ ...cached, readability: value });
    }
  }

  startInspecting(): void {
    this.inspector.startInspecting();
  }

  stopInspecting(): void {
    this.inspector.stopInspecting();
  }

  highlight(selector: string): void {
    if (validateSelector(selector)) {
      this.previewer.highlight(selector);
    } else {
      this.previewer.unhighlight();
    }
  }

  unhighlight(): void {
    this.previewer.unhighlight();
  }

  getPageColors(): Promise<RoleColorGroups> {
    return Promise.resolve(getPageColors());
  }

  getComputedStyles(
    selector: string,
    properties: Array<string>
  ): Promise<Record<string, string>> {
    return Promise.resolve(getComputedStyles(selector, properties));
  }

  openInPage(): void {
    return;
  }

  focusPage(): void {
    return;
  }
}
