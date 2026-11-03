import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';

type Page = Parameters<NonNullable<TestRunnerConfig['preVisit']>>[0];
type CDPSession = Awaited<
  ReturnType<ReturnType<Page['context']>['newCDPSession']>
>;

const PHONE = { width: 402, height: 874 };

let desktopViewport: { width: number; height: number } | null = null;

// Emulation lasts only as long as the session that set it.
const sessions = new WeakMap<Page, CDPSession>();

const sessionFor = async (page: Page): Promise<CDPSession> => {
  const existing = sessions.get(page);

  if (existing) {
    return existing;
  }

  const session = await page.context().newCDPSession(page);

  sessions.set(page, session);

  return session;
};

/**
 * Runs stories with the `touchscreen` parameter as a phone: a touchscreen
 * without hover, at iPhone width. Every other story gets the desktop page
 * back, since the runner reuses one page across stories.
 */
const config: TestRunnerConfig = {
  async preVisit(page, context) {
    const { parameters } = await getStoryContext(page, context);
    const touch = parameters.touchscreen === true;
    const cdp = await sessionFor(page);

    await cdp.send(
      'Emulation.setTouchEmulationEnabled',
      touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }
    );
    await cdp.send('Emulation.setEmitTouchEventsForMouse', {
      enabled: touch,
    });

    if (touch) {
      desktopViewport = page.viewportSize();
      await page.setViewportSize(PHONE);
    }
  },

  async postVisit(page) {
    if (desktopViewport) {
      await page.setViewportSize(desktopViewport);
      desktopViewport = null;
    }
  },
};

export default config;
