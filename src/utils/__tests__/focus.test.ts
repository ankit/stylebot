import { consumeFieldEscape, isFieldTarget } from '../focus';

const escapeFrom = (target: HTMLElement): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'target', { value: target });
  return event;
};

describe('isFieldTarget', () => {
  it('counts text entry elements as fields', () => {
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    Object.defineProperty(editable, 'isContentEditable', { value: true });

    expect(isFieldTarget(document.createElement('input'))).toBe(true);
    expect(isFieldTarget(document.createElement('textarea'))).toBe(true);
    expect(isFieldTarget(document.createElement('select'))).toBe(true);
    expect(isFieldTarget(editable)).toBe(true);
  });

  it('counts a combobox shown as something other than a text field', () => {
    const combobox = document.createElement('div');
    combobox.setAttribute('role', 'combobox');

    expect(isFieldTarget(combobox)).toBe(true);
  });

  it('does not count buttons or non-elements', () => {
    expect(isFieldTarget(document.createElement('button'))).toBe(false);
    expect(isFieldTarget(null)).toBe(false);
  });
});

describe('consumeFieldEscape', () => {
  it('consumes an Escape from a field once, for the innermost section', () => {
    const event = escapeFrom(document.createElement('input'));

    expect(consumeFieldEscape(event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(consumeFieldEscape(event)).toBe(false);
  });

  it('leaves an Escape from a button alone', () => {
    const event = escapeFrom(document.createElement('button'));

    expect(consumeFieldEscape(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });
});
