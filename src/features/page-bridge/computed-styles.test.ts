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
    jest.useFakeTimers();
    document.body.innerHTML = '<a><span>link</span></a>';
    const link = document.querySelector('a') as Element;
    const hovered = jest.spyOn(link, 'matches').mockReturnValue(true);
    const onHoverEnd = jest.fn();
    const mouseOut = (from: Element): void => {
      from.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      jest.runAllTimers();
    };

    const { unwatch } = getComputedStyles('a', ['font-size'], onHoverEnd);
    expect(unwatch).not.toBeNull();

    mouseOut(link.querySelector('span') as Element);
    expect(onHoverEnd).not.toHaveBeenCalled();

    hovered.mockReturnValue(false);
    mouseOut(link);
    mouseOut(link);
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('hears the pointer leave even when the page’s listeners are stopped', () => {
    jest.useFakeTimers();
    document.body.innerHTML = '<a>link</a>';
    const link = document.querySelector('a') as Element;
    jest
      .spyOn(link, 'matches')
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    const onHoverEnd = jest.fn();
    const stop = (event: Event): void => event.stopPropagation();
    window.addEventListener('mouseout', stop, true);

    getComputedStyles('a', ['font-size'], onHoverEnd);
    link.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    jest.runAllTimers();

    expect(onHoverEnd).toHaveBeenCalledTimes(1);
    window.removeEventListener('mouseout', stop, true);
    jest.useRealTimers();
  });

  it('skips the editor host’s ancestors, which stay hovered', () => {
    document.body.innerHTML = '<main><div id="stylebot"></div></main>';
    jest
      .spyOn(document.querySelector('main') as Element, 'matches')
      .mockReturnValue(true);

    expect(getComputedStyles('main', ['font-size']).unwatch).toBeNull();
  });
});
