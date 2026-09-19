import type { Locator, Page } from '@playwright/test';
import type { PageFunction } from 'playwright-core/types/structs';
import type { ExtensionFunction, Popup, PopupLocator } from '../engine';

type LocatorOptions = { hasText?: string | RegExp };

class ChromiumPopupLocator implements PopupLocator {
  constructor(private readonly inner: Locator) {}

  locator(selector: string, options?: LocatorOptions): PopupLocator {
    return new ChromiumPopupLocator(this.inner.locator(selector, options));
  }

  click(): Promise<void> {
    return this.inner.dispatchEvent('click');
  }

  isVisible(): Promise<boolean> {
    return this.inner.isVisible();
  }

  isEnabled(): Promise<boolean> {
    return this.inner.isEnabled();
  }

  isChecked(): Promise<boolean> {
    return this.inner.isChecked();
  }
}

// The popup is a real Playwright page here; this just narrows its surface to
// what firefox/popup.ts can also provide.
export class ChromiumPopup implements Popup {
  constructor(private readonly page: Page) {}

  locator(selector: string, options?: LocatorOptions): PopupLocator {
    return new ChromiumPopupLocator(this.page.locator(selector, options));
  }

  evaluate<A, R>(fn: ExtensionFunction<A, R>, arg?: A): Promise<R> {
    return this.page.evaluate(fn as PageFunction<A, R>, arg as A);
  }

  close(): Promise<void> {
    return this.page.close();
  }
}
