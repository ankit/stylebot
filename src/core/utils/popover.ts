/**
 * Lifts an element already in the page into the top layer as a manual
 * popover, above anything the page stacks by z-index. Browsers without
 * popovers leave it where it is.
 */
export const showAsManualPopover = (el: HTMLElement): void => {
  if (typeof el.showPopover !== 'function') {
    return;
  }

  el.popover = 'manual';
  el.showPopover();
};
