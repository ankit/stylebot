import { getComputedStyles } from './computed-styles';

describe('getComputedStyles', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reads the first match, skipping the editor host', () => {
    document.body.innerHTML = `
      <div id="stylebot"><h1 style="font-size: 10px">panel</h1></div>
      <h1 style="font-size: 24px; padding-top: 4px">first</h1>
      <h1 style="font-size: 30px">second</h1>
    `;

    expect(getComputedStyles('h1', ['font-size', 'padding-top'])).toEqual({
      styles: { 'font-size': '24px', 'padding-top': '4px' },
      unwatch: null,
    });
  });

  it('is empty for an unmatched or invalid selector', () => {
    expect(getComputedStyles('.missing', ['font-size']).styles).toEqual({});
    expect(getComputedStyles('h1[', ['font-size']).styles).toEqual({});
  });

  it('calls back once the pointer leaves a hovered element', () => {
    document.body.innerHTML = '<a>link</a>';
    const link = document.querySelector('a') as Element;
    jest.spyOn(link, 'matches').mockReturnValue(true);
    const onHoverEnd = jest.fn();

    const { unwatch } = getComputedStyles('a', ['font-size'], onHoverEnd);
    expect(unwatch).not.toBeNull();

    link.dispatchEvent(new MouseEvent('mouseleave'));
    link.dispatchEvent(new MouseEvent('mouseleave'));
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
  });

  it('skips the editor host’s ancestors, which stay hovered', () => {
    document.body.innerHTML = '<main><div id="stylebot"></div></main>';
    jest
      .spyOn(document.querySelector('main') as Element, 'matches')
      .mockReturnValue(true);

    expect(getComputedStyles('main', ['font-size']).unwatch).toBeNull();
  });
});
