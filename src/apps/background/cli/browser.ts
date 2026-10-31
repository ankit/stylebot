import type { CliCommands } from './types';

const INSTANCE_KEY = 'cli-instance';

type Brands = { brands?: Array<{ brand: string }> };

/**
 * The browser's name, such as Chrome or Edge, from its user agent brands.
 * Browsers that don't brand themselves, such as Vivaldi, read as Chromium.
 */
export const getBrowserName = (userAgentData?: Brands): string => {
  const brand = userAgentData?.brands
    ?.map(({ brand }) => brand)
    .find(brand => !/not.?a.?brand|^chromium$/i.test(brand));

  return (brand ?? 'Chromium').replace(/^(Google|Microsoft) /, '');
};

/**
 * A short id kept for this browser profile, which tells apart two profiles
 * of one browser that both run Stylebot.
 */
const getInstance = async (): Promise<string> => {
  const items = await chrome.storage.local.get(INSTANCE_KEY);

  if (typeof items[INSTANCE_KEY] === 'string') {
    return items[INSTANCE_KEY];
  }

  const instance = Math.random().toString(36).slice(2, 6);
  await chrome.storage.local.set({ [INSTANCE_KEY]: instance });
  return instance;
};

/**
 * The page in the window the user was last in, to help them recognize
 * this browser among others.
 */
const getPage = async () => {
  try {
    const window = await chrome.windows.getLastFocused({
      populate: true,
      windowTypes: ['normal'],
    });
    const tab = window.tabs?.find(({ active }) => active);

    return tab ? { title: tab.title, url: tab.url } : undefined;
  } catch {
    return undefined;
  }
};

export const browserCommands: CliCommands = {
  async browser() {
    return {
      name: getBrowserName(
        (navigator as Navigator & { userAgentData?: Brands }).userAgentData
      ),
      instance: await getInstance(),
      page: await getPage(),
    };
  },
};
