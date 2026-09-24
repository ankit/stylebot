import { claimFieldEscape, isField } from '../field-escape';

const escapeFrom = (target: HTMLElement): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'target', { value: target });
  return event;
};

describe('isField', () => {
  it('counts text entry elements as fields', () => {
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    Object.defineProperty(editable, 'isContentEditable', { value: true });

    expect(isField(document.createElement('input'))).toBe(true);
    expect(isField(document.createElement('textarea'))).toBe(true);
    expect(isField(document.createElement('select'))).toBe(true);
    expect(isField(editable)).toBe(true);
  });

  it('does not count buttons or non-elements', () => {
    expect(isField(document.createElement('button'))).toBe(false);
    expect(isField(null)).toBe(false);
  });
});

describe('claimFieldEscape', () => {
  it('claims an Escape from a field once, for the innermost section', () => {
    const event = escapeFrom(document.createElement('input'));

    expect(claimFieldEscape(event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(claimFieldEscape(event)).toBe(false);
  });

  it('leaves an Escape from a button alone', () => {
    const event = escapeFrom(document.createElement('button'));

    expect(claimFieldEscape(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });
});
