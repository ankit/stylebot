export const MAX_RECENT_COLORS = 8;

export const getAll = (): Promise<Array<string>> =>
  new Promise(resolve => {
    chrome.storage.local.get('recentColors', items => {
      resolve(items['recentColors'] || []);
    });
  });

export const add = async (color: string): Promise<Array<string>> => {
  const existing = await getAll();
  const deduped = existing.filter(c => c.toLowerCase() !== color.toLowerCase());
  const next = [color, ...deduped].slice(0, MAX_RECENT_COLORS);

  await new Promise<void>(resolve => {
    chrome.storage.local.set({ recentColors: next }, resolve);
  });

  return next;
};
