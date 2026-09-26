jest.mock('@stylebot/css', () => ({
  getSelector: (el: HTMLElement) => `${el.tagName.toLowerCase()}.picked`,
}));

import { createContextMenuHandler } from '../context-menu';

describe('createContextMenuHandler', () => {
  it("remembers the selector of the context menu's target", () => {
    const commit = jest.fn();

    createContextMenuHandler({ commit })(document.createElement('h1'));

    expect(commit).toHaveBeenCalledWith('setContextMenuSelector', 'h1.picked');
  });

  it('does nothing without a target', () => {
    const commit = jest.fn();

    createContextMenuHandler({ commit })(null);

    expect(commit).not.toHaveBeenCalled();
  });
});
