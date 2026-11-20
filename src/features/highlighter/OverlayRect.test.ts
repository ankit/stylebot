import OverlayRect from './OverlayRect';

const box = {
  top: 10,
  left: 10,
  right: 110,
  bottom: 60,
  width: 100,
  height: 50,
};
const dims = {
  borderLeft: 1,
  borderRight: 1,
  borderTop: 1,
  borderBottom: 1,
  marginLeft: 8,
  marginRight: 8,
  marginTop: 8,
  marginBottom: 8,
  paddingLeft: 4,
  paddingRight: 4,
  paddingTop: 4,
  paddingBottom: 4,
};

const transparent = (el: HTMLElement) => el.style.borderColor === 'transparent';

describe('OverlayRect', () => {
  it('shows only the given layer', () => {
    const rect = new OverlayRect(document, document.body);

    rect.update(box, dims, 'padding');

    expect(transparent(rect.padding)).toBe(false);
    expect(transparent(rect.node)).toBe(true);
    expect(transparent(rect.border)).toBe(true);
    expect(rect.content.style.backgroundColor).toBe('transparent');
  });

  it('shows every layer again once reused without one', () => {
    const rect = new OverlayRect(document, document.body);

    rect.update(box, dims, 'padding');
    rect.update(box, dims);

    expect(transparent(rect.node)).toBe(false);
    expect(transparent(rect.border)).toBe(false);
    expect(transparent(rect.padding)).toBe(false);
    expect(rect.content.style.backgroundColor).not.toBe('transparent');
  });
});
