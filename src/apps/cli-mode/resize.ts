// The closest the terminal comes to the viewport's edges.
export const EDGE = 8;
// The smallest the user can resize the open terminal to.
export const MIN_WIDTH = 320;
export const MIN_HEIGHT = 240;

// The edges and corners the open terminal resizes from.
export const RESIZE_EDGES = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];

export type Size = { width: number; height: number };
// Offsets from the viewport's right and bottom.
export type Position = { right: number; bottom: number };

const clamp = (value: number, min: number, max: number): number =>
  Math.max(Math.min(value, max), min);

/**
 * The terminal's size and position after dragging one of its edges or
 * corners by `delta` from where they were: the opposite sides stay put, and
 * it keeps a minimum size and stays in the viewport.
 */
export const resizeFrom = (
  edge: string,
  from: { size: Size; position: Position },
  delta: { x: number; y: number },
  viewport: Size
): { size: Size; position: Position } => {
  const { size, position } = from;
  let { width, height } = size;

  if (edge.includes('w')) {
    width = clamp(
      size.width - delta.x,
      MIN_WIDTH,
      viewport.width - position.right - EDGE
    );
  } else if (edge.includes('e')) {
    width = clamp(
      size.width + delta.x,
      MIN_WIDTH,
      size.width + position.right - EDGE
    );
  }

  if (edge.includes('n')) {
    height = clamp(
      size.height - delta.y,
      MIN_HEIGHT,
      viewport.height - position.bottom - EDGE
    );
  } else if (edge.includes('s')) {
    height = clamp(
      size.height + delta.y,
      MIN_HEIGHT,
      size.height + position.bottom - EDGE
    );
  }

  return {
    size: { width: Math.round(width), height: Math.round(height) },
    position: {
      right: Math.round(
        edge.includes('e')
          ? position.right - (width - size.width)
          : position.right
      ),
      bottom: Math.round(
        edge.includes('s')
          ? position.bottom - (height - size.height)
          : position.bottom
      ),
    },
  };
};

/**
 * Calls `move` with how far the pointer has moved from a press until it's
 * let go, then `end`, capturing the pointer on the element pressed.
 */
export const followPointer = (
  event: PointerEvent,
  move: (delta: { x: number; y: number }) => void,
  end: () => void
): void => {
  const handle = event.currentTarget as HTMLElement;
  const start = { x: event.clientX, y: event.clientY };

  const onMove = (moved: PointerEvent): void =>
    move({ x: moved.clientX - start.x, y: moved.clientY - start.y });

  const onEnd = (): void => {
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onEnd);
    handle.removeEventListener('pointercancel', onEnd);
    end();
  };

  event.preventDefault();
  handle.setPointerCapture(event.pointerId);
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onEnd);
  handle.addEventListener('pointercancel', onEnd);
};
