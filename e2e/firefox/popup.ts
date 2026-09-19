import type { ExtensionFunction, Popup, PopupLocator } from '../engine';
import type { FirefoxExtension, TargetForm } from './extension';

type LocatorOptions = { hasText?: string | RegExp };

// A RegExp can't cross the JSON boundary into the popup, so it travels as parts.
type SerializedText = string | { source: string; flags: string };

type Step = { selector: string; hasText?: SerializedText };

type Query = 'click' | 'visible' | 'enabled' | 'checked';

const ACTION_TIMEOUT_MS = 5_000;
const POLL_INTERVAL_MS = 100;

/*
 * Runs inside the popup document. Resolves the locator chain (each step searches
 * within the previous match, like Playwright's nested locators), then answers the
 * query; `null` means the element isn't there (yet).
 */
function runQuery({ steps, query }: { steps: Array<Step>; query: Query }) {
  const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
  const matchesText = (el: Element, hasText?: SerializedText) => {
    if (hasText === undefined) {
      return true;
    }
    const text = normalize(el.textContent ?? '');
    return typeof hasText === 'string'
      ? text.includes(hasText)
      : new RegExp(hasText.source, hasText.flags).test(text);
  };

  let scope: ParentNode = document;
  let el: Element | null = null;
  for (const step of steps) {
    el =
      Array.from(scope.querySelectorAll(step.selector)).find(candidate =>
        matchesText(candidate, step.hasText)
      ) ?? null;
    if (!el) {
      return null;
    }
    scope = el;
  }

  const input = el as HTMLInputElement;
  switch (query) {
    case 'click':
      input.click();
      return true;
    case 'visible':
      return (
        input.getClientRects().length > 0 &&
        getComputedStyle(input).visibility !== 'hidden'
      );
    case 'enabled':
      return !input.disabled;
    case 'checked':
      return input.checked;
  }
}

class FirefoxPopupLocator implements PopupLocator {
  constructor(
    private readonly popup: FirefoxPopup,
    private readonly steps: Array<Step>
  ) {}

  locator(selector: string, options?: LocatorOptions): PopupLocator {
    return new FirefoxPopupLocator(this.popup, [
      ...this.steps,
      { selector, hasText: serializeText(options?.hasText) },
    ]);
  }

  async click(): Promise<void> {
    const deadline = Date.now() + ACTION_TIMEOUT_MS;
    while ((await this.query('click')) === null) {
      if (Date.now() > deadline) {
        throw new Error(
          `Timed out waiting for popup element ${describe(this.steps)}`
        );
      }
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  async isVisible(): Promise<boolean> {
    return (await this.query('visible')) === true;
  }

  async isEnabled(): Promise<boolean> {
    return (await this.query('enabled')) === true;
  }

  async isChecked(): Promise<boolean> {
    return (await this.query('checked')) === true;
  }

  private query(query: Query): Promise<boolean | null> {
    return this.popup.evaluate(runQuery, { steps: this.steps, query });
  }
}

function serializeText(hasText?: string | RegExp): SerializedText | undefined {
  return hasText instanceof RegExp
    ? { source: hasText.source, flags: hasText.flags }
    : hasText;
}

function describe(steps: Array<Step>): string {
  return steps.map(step => step.selector).join(' >> ');
}

// The popup lives in a background tab; its DOM is reached through the same
// DevTools console channel as the background page.
export class FirefoxPopup implements Popup {
  constructor(
    private readonly extension: FirefoxExtension,
    private readonly target: TargetForm,
    private readonly tabId: number
  ) {}

  locator(selector: string, options?: LocatorOptions): PopupLocator {
    return new FirefoxPopupLocator(this, [
      { selector, hasText: serializeText(options?.hasText) },
    ]);
  }

  evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R> {
    return this.extension.evaluateIn(this.target, fn, arg);
  }

  async close(): Promise<void> {
    await this.extension.evaluate(
      tabId => chrome.tabs.remove(tabId),
      this.tabId
    );
  }
}
