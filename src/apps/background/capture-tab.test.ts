import { captureTab } from './capture-tab';

const SHOT = 'data:image/png;base64,shot';

const mockTabs = (tabs: Record<string, jest.Mock>) => {
  global.chrome = { tabs } as unknown as typeof chrome;
};

describe('captureTab', () => {
  it('captures a background tab where it is on Firefox, without showing it', async () => {
    const tabs = {
      captureTab: jest.fn(async () => SHOT),
      captureVisibleTab: jest.fn(),
      update: jest.fn(),
    };
    mockTabs(tabs);

    const shot = await captureTab({
      id: 3,
      windowId: 1,
      active: false,
    } as chrome.tabs.Tab);

    expect(shot).toBe(SHOT);
    expect(tabs.captureTab).toHaveBeenCalledWith(3, { format: 'png' });
    expect(tabs.update).not.toHaveBeenCalled();
    expect(tabs.captureVisibleTab).not.toHaveBeenCalled();
  });

  it("captures an active tab through its window where there's no captureTab", async () => {
    const tabs = { captureVisibleTab: jest.fn(async () => SHOT) };
    mockTabs(tabs);

    const shot = await captureTab({
      id: 3,
      windowId: 1,
      active: true,
    } as chrome.tabs.Tab);

    expect(shot).toBe(SHOT);
    expect(tabs.captureVisibleTab).toHaveBeenCalledWith(1, { format: 'png' });
  });
});
