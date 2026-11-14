jest.mock('@stylebot/css', () => ({
  getSelector: (el: HTMLElement) => `${el.tagName.toLowerCase()}.picked`,
}));

import { createContextMenuHandler } from './context-menu';

describe('createContextMenuHandler', () => {
  it("remembers the context menu's target and its selector", () => {
    const commit = jest.fn();
    const bridge = { setPickedElement: jest.fn() };
    const target = document.createElement('h1');

    createContextMenuHandler({ commit }, bridge)(target);

    expect(bridge.setPickedElement).toHaveBeenCalledWith(target);
    expect(commit).toHaveBeenCalledWith('setContextMenuSelector', 'h1.picked');
  });

  it('does nothing without a target', () => {
    const commit = jest.fn();
    const bridge = { setPickedElement: jest.fn() };

    createContextMenuHandler({ commit }, bridge)(null);

    expect(bridge.setPickedElement).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });
});
