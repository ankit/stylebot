import { injectStylesheet, removeStylesheet } from '@stylebot/stylesheets';

import { listenForGalleryPreview } from './gallery-preview';
import { applyPageState } from './page-state';
import { getCompiledStyles } from './saved-styles';

jest.mock('@stylebot/stylesheets', () => ({
  injectStylesheet: jest.fn(),
  removeStylesheet: jest.fn(),
}));
jest.mock('./page-state', () => ({
  applyPageState: jest.fn(),
  getPageState: () => ({
    styles: [
      { url: 'example.com', css: 'a {}', importUrls: [], enabled: true },
    ],
    readability: false,
  }),
}));
jest.mock('./saved-styles', () => ({ getCompiledStyles: jest.fn() }));

type Listener<T> = (value: T) => void;

/**
 * A port the popup would open, with ways to send it messages and close it.
 */
const connect = (name = 'gallery-preview') => {
  const onMessage: Array<Listener<unknown>> = [];
  const onDisconnect: Array<Listener<void>> = [];
  const port = {
    name,
    onMessage: { addListener: (fn: Listener<unknown>) => onMessage.push(fn) },
    onDisconnect: {
      addListener: (fn: Listener<void>) => onDisconnect.push(fn),
    },
  };

  onConnect.forEach(fn => fn(port));

  return {
    send: (message: unknown) => onMessage.forEach(fn => fn(message)),
    close: () => onDisconnect.forEach(fn => fn()),
  };
};

let onConnect: Array<Listener<unknown>>;

const settle = () => new Promise(resolve => setTimeout(resolve));

beforeEach(() => {
  jest.clearAllMocks();
  onConnect = [];
  (getCompiledStyles as jest.Mock).mockResolvedValue({});
  global.chrome = {
    runtime: {
      onConnect: { addListener: (fn: Listener<unknown>) => onConnect.push(fn) },
    },
  } as unknown as typeof chrome;

  listenForGalleryPreview();
});

describe('gallery preview', () => {
  it("shows a gallery style in place of the page's own", async () => {
    connect().send({ preview: { css: 'b {}', importUrls: [] } });
    await settle();

    expect(removeStylesheet).toHaveBeenCalledWith('example.com');
    expect(injectStylesheet).toHaveBeenCalledWith(
      'stylebot:gallery-preview',
      'b {}',
      []
    );
  });

  it('puts the page back when the popup closes', async () => {
    const port = connect();
    port.send({ preview: { css: 'b {}', importUrls: [] } });
    await settle();

    port.close();
    await settle();

    expect(removeStylesheet).toHaveBeenLastCalledWith(
      'stylebot:gallery-preview'
    );
    expect(applyPageState).toHaveBeenCalled();
  });

  it('leaves the page alone when the popup closes without previewing', async () => {
    connect().close();
    await settle();

    expect(applyPageState).not.toHaveBeenCalled();
  });

  it('ignores other ports', async () => {
    connect('other').send({ preview: { css: 'b {}', importUrls: [] } });
    await settle();

    expect(injectStylesheet).not.toHaveBeenCalled();
  });
});
