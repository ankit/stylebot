import { getNestedBoundingClientRect } from '../utils';

const rect = (left: number, top: number, width: number, height: number) =>
  ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  } as DOMRect);

describe('getNestedBoundingClientRect', () => {
  it('returns the plain rect for a node in the boundary window', () => {
    const node = document.createElement('div');
    node.getBoundingClientRect = () => rect(40, 48, 480, 67);

    expect(getNestedBoundingClientRect(node, window)).toEqual(
      rect(40, 48, 480, 67)
    );
  });

  it('does not add the offset of the frame the boundary window itself is in', () => {
    // A framed page (an embed, Storybook's preview): the window has a
    // frameElement, but the node still lives in the boundary window.
    const frame = document.createElement('iframe');
    frame.getBoundingClientRect = () => rect(230, 40, 1000, 800);
    const spy = jest
      .spyOn(window, 'frameElement', 'get')
      .mockReturnValue(frame);

    const node = document.createElement('div');
    node.getBoundingClientRect = () => rect(40, 48, 480, 67);

    expect(getNestedBoundingClientRect(node, window)).toEqual(
      rect(40, 48, 480, 67)
    );

    spy.mockRestore();
  });

  it('adds the child frame offset, and stops at the boundary window', () => {
    const frame = document.createElement('iframe');
    frame.style.border = '0';
    document.body.appendChild(frame);
    const childDocument = frame.contentDocument as Document;
    frame.getBoundingClientRect = () => rect(100, 20, 500, 400);

    // The boundary window is itself framed; that frame must not count.
    const outer = document.createElement('iframe');
    outer.getBoundingClientRect = () => rect(230, 40, 1000, 800);
    const spy = jest
      .spyOn(window, 'frameElement', 'get')
      .mockReturnValue(outer);

    const node = childDocument.createElement('div');
    childDocument.body.appendChild(node);
    node.getBoundingClientRect = () => rect(10, 5, 50, 30);

    const nested = getNestedBoundingClientRect(node, window);
    expect(nested.left).toBe(110);
    expect(nested.top).toBe(25);
    expect(nested.width).toBe(50);
    expect(nested.height).toBe(30);

    spy.mockRestore();
    frame.remove();
  });
});
