import { getCliWindowId } from './cli-window';
import { findTabShowing } from './targets';

jest.mock('../restore-tabs', () => ({ restoreTab: jest.fn() }));
jest.mock('../styles', () => ({ getAll: jest.fn() }));
jest.mock('./cli-window', () => ({ getCliWindowId: jest.fn() }));

const CLI_WINDOW = 1;
const YOUR_WINDOW = 2;

const tab = (id: number, url: string, windowId: number, active: boolean) =>
  ({ id, url, windowId, active } as chrome.tabs.Tab);

const inbox = tab(10, 'https://mail.example.com/inbox', YOUR_WINDOW, true);
const older = tab(11, 'https://mail.example.com/m/2', CLI_WINDOW, false);
const email = tab(12, 'https://mail.example.com/m/1', CLI_WINDOW, true);
const news = tab(13, 'https://news.example.com/', YOUR_WINDOW, false);

beforeEach(() => {
  global.chrome = {
    tabs: { query: jest.fn(async () => [inbox, older, email, news]) },
  } as unknown as typeof chrome;

  jest.mocked(getCliWindowId).mockResolvedValue(CLI_WINDOW);
});

describe('findTabShowing', () => {
  it("checks the CLI window's active tab, naming the others", async () => {
    await expect(
      findTabShowing('mail.example.com', 'mail.example.com')
    ).resolves.toEqual({ tab: email, others: [10, 11] });
  });

  it('falls back to any tab showing the site', async () => {
    jest.mocked(getCliWindowId).mockResolvedValue(undefined);

    await expect(
      findTabShowing('mail.example.com', 'mail.example.com')
    ).resolves.toEqual({ tab: inbox, others: [11, 12] });
  });

  it('checks the tab the target names, alone', async () => {
    await expect(findTabShowing('mail.example.com', '11')).resolves.toEqual({
      tab: older,
      others: [],
    });
  });

  it('finds nothing when no tab shows the site', async () => {
    await expect(findTabShowing('example.org', 'example.org')).resolves.toEqual(
      { tab: undefined, others: [] }
    );
  });
});
