import { type KeyActions, listenForKeys, runKey } from './keys';
import { createTerminalState } from './state';

const actions = (overrides: Partial<KeyActions> = {}): KeyActions => ({
  undo: jest.fn(),
  clearMarks: jest.fn(() => true),
  focusNote: jest.fn(),
  ...overrides,
});

describe('runKey', () => {
  it('opens and collapses the terminal with .', () => {
    const state = createTerminalState();

    expect(runKey('.', state, actions())).toBe(true);
    expect(state.expanded).toBe(true);

    runKey('.', state, actions());
    expect(state.expanded).toBe(false);
  });

  it('undoes with Z', () => {
    const undo = jest.fn();

    expect(runKey('z', createTerminalState(), actions({ undo }))).toBe(true);
    expect(undo).toHaveBeenCalled();
  });

  it('collapses with Escape, and leaves it to the page when collapsed', () => {
    const state = createTerminalState();

    expect(runKey('Escape', state, actions())).toBe(false);

    state.expanded = true;
    expect(runKey('Escape', state, actions())).toBe(true);
    expect(state.expanded).toBe(false);
  });

  it('clears the marks with X', () => {
    const keys = actions();

    expect(runKey('x', createTerminalState(), keys)).toBe(true);
    expect(keys.clearMarks).toHaveBeenCalled();
  });

  it('leaves X to the page when there are no marks', () => {
    const keys = actions({ clearMarks: jest.fn(() => false) });

    expect(runKey('X', createTerminalState(), keys)).toBe(false);
  });

  it('focuses the note field with /', () => {
    const keys = actions();

    expect(runKey('/', createTerminalState(), keys)).toBe(true);
    expect(keys.focusNote).toHaveBeenCalled();
  });

  it('leaves other keys to the page', () => {
    expect(runKey('a', createTerminalState(), actions())).toBe(false);
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

  const shadowRoot = () =>
    document.createElement('div').attachShadow({ mode: 'closed' });

  it('runs keys pressed on the page, ahead of it', () => {
    const state = createTerminalState();
    const stop = listenForKeys(state, actions(), shadowRoot());

    expect(press(document.body, { key: '.' }).defaultPrevented).toBe(true);
    expect(state.expanded).toBe(true);
    stop();

    press(document.body, { key: '.' });
    expect(state.expanded).toBe(true);
  });

  it('skips keys typed in a field or with a modifier', () => {
    const state = createTerminalState();
    const stop = listenForKeys(state, actions(), shadowRoot());
    const input = document.createElement('input');

    document.body.append(input);
    press(input, { key: '.' });
    press(document.body, { key: '.', metaKey: true });

    expect(state.expanded).toBe(false);
    stop();
    input.remove();
  });

  it("skips keys typed in the terminal's own field, hidden in its closed root", () => {
    const state = createTerminalState();
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'closed' });
    const field = document.createElement('textarea');
    const keys = actions();

    root.append(field);
    document.body.append(host);
    field.focus();

    const stop = listenForKeys(state, keys, root);
    const event = press(field, { key: '/', composed: true });

    expect(event.defaultPrevented).toBe(false);
    expect(keys.focusNote).not.toHaveBeenCalled();
    stop();
    host.remove();
  });
});
