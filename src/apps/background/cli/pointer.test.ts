import { pointerCommands } from './pointer';
import { inspectTab, resolveTab } from './targets';
import { getAll } from '../styles';

jest.mock('../styles', () => ({ getAll: jest.fn() }));
jest.mock('./targets', () => ({
  ...jest.requireActual('./targets'),
  inspectTab: jest.fn(),
  resolveTab: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (resolveTab as jest.Mock).mockResolvedValue({
    id: 7,
    url: 'https://example.com/a',
  });
  (inspectTab as jest.Mock).mockResolvedValue({ x: 1, y: 2, selector: 'h1' });
  (getAll as jest.Mock).mockResolvedValue({
    'example.com': { css: 'h1 { color: red; }', enabled: true },
  });
});

describe('pointerCommands', () => {
  it('hovers a selector', async () => {
    await expect(
      pointerCommands.hover({ tab: '7', selector: 'h1' })
    ).resolves.toEqual({ x: 1, y: 2, selector: 'h1' });

    expect(inspectTab).toHaveBeenCalledWith(7, {
      kind: 'pointer',
      action: { kind: 'hover', selector: 'h1' },
    });
  });

  it('inspects a point with the css saved for the page', async () => {
    await pointerCommands.inspect({ tab: '7', x: 10, y: 20 });

    expect(inspectTab).toHaveBeenCalledWith(7, {
      kind: 'pointer',
      action: { kind: 'inspect', x: 10, y: 20, css: 'h1 { color: red; }' },
    });
  });

  it('needs the tab named', async () => {
    await expect(pointerCommands.hover({ selector: 'a' })).rejects.toThrow(
      'Name the tab'
    );
  });
});
