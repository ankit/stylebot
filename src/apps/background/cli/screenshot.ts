import type { ElementFrame, PseudoState, ViewportRect } from '@stylebot/types';

import { captureTab } from '../capture-tab';
import { captureWithTerminal } from './mode/terminal';
import { withPseudoState } from './pseudo-states';
import {
  getClipRegion,
  getElementRegion,
  parseClip,
  parseScale,
  planCrop,
  toImageRect,
  type Region,
  type Size,
} from './screenshot-region';
import { inspectTab, requireNamed, resolveTab } from './targets';

// The compositor's next frame after a scroll, before an active tab is captured.
export const SCROLL_PAINT_DELAY_MS = 100;

export type Screenshot = {
  dataUrl: string;
  width: number;
  height: number;
  scale: number;
  viewport: Size;
  cutOff: boolean;
  // Where CLI mode's terminal covers the image, in image pixels.
  cliTerminal?: ViewportRect;
};

// The tab's capture, the part of it the screenshot keeps, and where CLI
// mode's terminal covers the viewport, if it does.
type Capture = {
  dataUrl: string;
  region?: Region;
  covered?: ViewportRect | null;
};

/**
 * A tab's viewport in css pixels: its size divided by its page zoom.
 */
export const getViewport = async (tab: chrome.tabs.Tab): Promise<Size> => {
  const zoom = await chrome.tabs.getZoom(tab.id as number);

  return {
    width: Math.round((tab.width ?? 0) / zoom),
    height: Math.round((tab.height ?? 0) / zoom),
  };
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * Crops a capture to a region of the viewport and resizes it to a scale,
 * leaving it as it is when neither changes it.
 */
export const renderCapture = async (
  dataUrl: string,
  viewport: Size,
  region: ViewportRect | undefined,
  scale: number
): Promise<{ dataUrl: string; width: number; height: number }> => {
  const image = await createImageBitmap(await (await fetch(dataUrl)).blob());

  try {
    const { source, output } = planCrop(image, viewport, region, scale);

    if (
      source.width === image.width &&
      source.height === image.height &&
      output.width === image.width &&
      output.height === image.height
    ) {
      return { dataUrl, ...output };
    }

    const canvas = new OffscreenCanvas(output.width, output.height);
    const context = canvas.getContext(
      '2d'
    ) as OffscreenCanvasRenderingContext2D;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      image,
      source.x,
      source.y,
      source.width,
      source.height,
      0,
      0,
      output.width,
      output.height
    );

    return {
      dataUrl: await blobToDataUrl(
        await canvas.convertToBlob({ type: 'image/png' })
      ),
      ...output,
    };
  } finally {
    image.close();
  }
};

/**
 * Captures a selector's first visible match, scrolled into view for the
 * capture and back afterwards.
 */
const captureElement = async (
  tab: chrome.tabs.Tab,
  selector: string,
  viewport: Size
): Promise<Capture & { region: Region }> => {
  const tabId = tab.id as number;
  const frame = await inspectTab<ElementFrame>(tabId, {
    kind: 'frameElement',
    selector,
  });

  try {
    const region = getElementRegion(frame.rect, viewport);

    if (frame.scrolled && tab.active) {
      await new Promise(resolve => setTimeout(resolve, SCROLL_PAINT_DELAY_MS));
    }

    const { capture, covered } = await captureWithTerminal(tabId, () =>
      captureTab(tab)
    );

    return { dataUrl: capture, region, covered };
  } finally {
    if (frame.scrolled) {
      await inspectTab(tabId, { kind: 'restoreScroll' });
    }
  }
};

/**
 * A PNG of a tab's viewport, or of one element or a clip of it, at a scale in
 * image pixels per css pixel, with a state forced on an element if asked.
 */
export const takeScreenshot = async ({
  tab,
  selector,
  clip,
  scale,
  state,
  on,
}: Record<string, unknown>): Promise<Screenshot> => {
  requireNamed(tab, 'tab');

  if (selector !== undefined && clip !== undefined) {
    throw new Error('Pass --selector or --clip, not both');
  }

  if ((state === undefined) !== (on === undefined)) {
    throw new Error(
      "Pass --state with --on, the selector of the element it's forced on"
    );
  }

  const outputScale = parseScale(scale);
  const clipRect = clip === undefined ? undefined : parseClip(clip);
  const target = await resolveTab(tab);
  const viewport = await getViewport(target);

  const capture = async (): Promise<Capture> => {
    if (selector !== undefined) {
      return captureElement(target, String(selector), viewport);
    }

    const { capture: dataUrl, covered } = await captureWithTerminal(
      target.id as number,
      () => captureTab(target)
    );

    return {
      region: clipRect && getClipRegion(clipRect, viewport),
      dataUrl,
      covered,
    };
  };

  let shot: Capture;

  if (state === undefined) {
    shot = await capture();
  } else {
    const tabId = target.id as number;
    const forced = String(state) as PseudoState;
    shot = await withPseudoState(tabId, String(on), forced, capture);
  }

  const { dataUrl, region, covered } = shot;
  const cliTerminal = covered
    ? toImageRect(covered, region?.rect, outputScale)
    : undefined;

  return {
    ...(await renderCapture(dataUrl, viewport, region?.rect, outputScale)),
    scale: outputScale,
    viewport,
    cutOff: region?.cutOff ?? false,
    ...(cliTerminal && { cliTerminal }),
  };
};
