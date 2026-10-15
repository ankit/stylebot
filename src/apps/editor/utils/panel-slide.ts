// How long the panel takes to slide away; matches its transition.
const PANEL_SLIDE_MS = 220;

/**
 * Waits for the panel to finish sliding out of the page, and for the frame
 * without it, so a capture doesn't catch it on the way out.
 */
export const waitForPanelToSlideAway = (): Promise<void> =>
  new Promise(resolve =>
    setTimeout(() => requestAnimationFrame(() => resolve()), PANEL_SLIDE_MS)
  );
