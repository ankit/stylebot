// An area of a screenshot, in fractions of its size.
export type BlurArea = { x: number; y: number; width: number; height: number };

const createCanvas = (
  width: number,
  height: number
): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  return [canvas, canvas.getContext('2d') as CanvasRenderingContext2D];
};

/**
 * A blurred copy of the whole image, so an area's edges blend with what's
 * around it. Safari's canvas has no blur filter; there the image is halved
 * and doubled back in steps, which comes out smooth rather than blocky.
 */
const blurCanvas = (
  source: HTMLCanvasElement,
  radius: number
): HTMLCanvasElement => {
  const { width, height } = source;
  const [canvas, context] = createCanvas(width, height);

  if ('filter' in context) {
    // Drawn over a sharp copy, so the blur's soft outer edge isn't see-through.
    context.drawImage(source, 0, 0);
    context.filter = `blur(${radius}px)`;
    context.drawImage(source, 0, 0);
    return canvas;
  }

  const steps = Math.max(1, Math.round(Math.log2(radius)));
  let current = source;

  for (let i = 0; i < steps; i++) {
    const [half, halfContext] = createCanvas(
      current.width / 2,
      current.height / 2
    );
    halfContext.imageSmoothingQuality = 'high';
    halfContext.drawImage(current, 0, 0, half.width, half.height);
    current = half;
  }

  for (let i = 0; i < steps; i++) {
    const [up, upContext] =
      i === steps - 1
        ? [canvas, context]
        : createCanvas(current.width * 2, current.height * 2);
    upContext.imageSmoothingQuality = 'high';
    upContext.drawImage(current, 0, 0, up.width, up.height);
    current = up;
  }

  return canvas;
};

/**
 * Blurs areas of a loaded image into its pixels, with the radius in the
 * image's own pixels, and returns the result as a WebP data URL.
 */
export const blurScreenshotAreas = (
  image: HTMLImageElement,
  areas: Array<BlurArea>,
  radius: number
): string => {
  const { naturalWidth: width, naturalHeight: height } = image;
  const [canvas, context] = createCanvas(width, height);
  context.drawImage(image, 0, 0);

  const blurred = blurCanvas(canvas, radius);

  for (const area of areas) {
    const x = Math.round(area.x * width);
    const y = Math.round(area.y * height);
    const w = Math.max(1, Math.round(area.width * width));
    const h = Math.max(1, Math.round(area.height * height));

    context.drawImage(blurred, x, y, w, h, x, y, w, h);
  }

  return canvas.toDataURL('image/webp', 0.92);
};
