import { SCREENSHOT_MAX_BYTES } from './config';
import { compressScreenshot } from './compress-screenshot';

const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo=';

let mockContext: { imageSmoothingQuality: string };

type Encoder = (
  width: number,
  type: string,
  quality: number
) => { size: number; type: string };

const mockCanvas = (
  source: { width: number; height: number },
  encode: Encoder
) => {
  const sizes: Array<[number, number]> = [];
  const context = { drawImage: jest.fn(), imageSmoothingQuality: 'low' };

  global.createImageBitmap = jest.fn(
    async () => source
  ) as unknown as typeof createImageBitmap;

  global.OffscreenCanvas = jest.fn((width: number, height: number) => {
    if (width > 1) {
      sizes.push([width, height]);
    }

    return {
      getContext: () => context,
      convertToBlob: async ({
        type,
        quality,
      }: {
        type: string;
        quality: number;
      }) => {
        const { size, type: actual } = encode(width, type, quality);
        return new Blob([new Uint8Array(size)], { type: actual });
      },
    };
  }) as unknown as typeof OffscreenCanvas;

  mockContext = context;

  return sizes;
};

describe('compressScreenshot', () => {
  it('caps the width and keeps the aspect ratio', async () => {
    const sizes = mockCanvas({ width: 4000, height: 2500 }, (_, type) => ({
      size: 1000,
      type,
    }));

    const blob = await compressScreenshot(PNG_DATA_URL);

    expect(blob.type).toBe('image/webp');
    expect(sizes).toEqual([[2880, 1800]]);
  });

  it('falls back to JPEG where WebP is encoded as PNG', async () => {
    mockCanvas({ width: 1200, height: 800 }, (_, type) => ({
      size: 1000,
      type: type === 'image/webp' ? 'image/png' : type,
    }));

    expect((await compressScreenshot(PNG_DATA_URL)).type).toBe('image/jpeg');
  });

  it('encodes once, smoothed, when the screenshot fits', async () => {
    const qualities: Array<number> = [];
    mockCanvas({ width: 1600, height: 1000 }, (w, type, q) => {
      if (w > 1) {
        qualities.push(q);
      }
      return { size: 1000, type };
    });

    await compressScreenshot(PNG_DATA_URL);

    expect(qualities).toEqual([0.85]);
    expect(mockContext.imageSmoothingQuality).toBe('high');
  });

  it('searches the quality down before the size', async () => {
    const qualities: Array<number> = [];
    const sizes = mockCanvas({ width: 1600, height: 1000 }, (w, type, q) => {
      if (w > 1) {
        qualities.push(q);
      }
      return { size: q > 0.75 ? SCREENSHOT_MAX_BYTES + 1 : 1000, type };
    });

    await compressScreenshot(PNG_DATA_URL);

    expect(sizes).toEqual([[1600, 1000]]);
    expect(qualities).toEqual([
      0.85,
      0.7,
      expect.closeTo(0.775),
      expect.closeTo(0.7375),
    ]);
  });

  it('scales down until it fits under 1 MB', async () => {
    const sizes = mockCanvas({ width: 1600, height: 1000 }, width => ({
      size: width > 1000 ? SCREENSHOT_MAX_BYTES + 1 : 1000,
      type: 'image/webp',
    }));

    await compressScreenshot(PNG_DATA_URL);

    expect(sizes.map(([width]) => width)).toEqual([1600, 1360, 1156, 983]);
  });

  it('gives up once it would be too small to see', async () => {
    mockCanvas({ width: 1600, height: 1000 }, () => ({
      size: SCREENSHOT_MAX_BYTES + 1,
      type: 'image/webp',
    }));

    await expect(compressScreenshot(PNG_DATA_URL)).rejects.toMatchObject({
      status: 413,
    });
  });
});
