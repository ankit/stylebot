/**
 * Makes room beside the page's body for a panel docked on that side,
 * or gives the room back when side is null.
 */
export const reservePageSpace = (
  side: 'left' | 'right' | null,
  reserved: number
): void => {
  const { style } = document.body;

  if (side === 'left') {
    style.width = '';
    style.marginRight = '';
    style.marginLeft = `${reserved}px`;
  } else if (side === 'right') {
    style.marginLeft = '';
    // An RTL page resolves the over-constrained body from its right
    // edge, so the explicit margin (not just the width) keeps the gap on the right.
    style.marginRight = `${reserved}px`;
    style.width = `calc(100% - ${reserved}px)`;
  } else {
    style.width = '';
    style.marginLeft = '';
    style.marginRight = '';
  }
};
