import { listenForKeys, runKey } from './keys';
import { createTerminalState } from './state';

describe('runKey', () => {
  it('opens and collapses the terminal with .', () => {
    const state = createTerminalState();

    expect(runKey('.', state, jest.fn())).toBe(true);
    expect(state.expanded).toBe(true);

    runKey('.', state, jest.fn());
    expect(state.expanded).toBe(false);
  });

  it('undoes with Z', () => {
    const undo = jest.fn();

    expect(runKey('z', createTerminalState(), undo)).toBe(true);
    expect(undo).toHaveBeenCalled();
  });

  it('collapses with Escape, and leaves it to the page when collapsed', () => {
    const state = createTerminalState();

    expect(runKey('Escape', state, jest.fn())).toBe(false);

    state.expanded = true;
    expect(runKey('Escape', state, jest.fn())).toBe(true);
    expect(state.expanded).toBe(false);
  });

  it('leaves other keys to the page', () => {
    expect(runKey('a', createTerminalState(), jest.fn())).toBe(false);
  });
});

describe('listenForKeys', () => {
  const press = (target: EventTarget, init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ...init,
    });

    target.dispatchEvent(event);
    return event;
  };

  it('runs keys pressed on the page, ahead of it', () => {
    const state = createTerminalState();
    const stop = listenForKeys(state, jest.fn());

    expect(press(document.body, { key: '.' }).defaultPrevented).toBe(true);
    expect(state.expanded).toBe(true);
    stop();

    press(document.body, { key: '.' });
    expect(state.expanded).toBe(true);
  });

  it('skips keys typed in a field or with a modifier', () => {
    const state = createTerminalState();
    const stop = listenForKeys(state, jest.fn());
    const input = document.createElement('input');

    document.body.append(input);
    press(input, { key: '.' });
    press(document.body, { key: '.', metaKey: true });

    expect(state.expanded).toBe(false);
    stop();
    input.remove();
  });
});
