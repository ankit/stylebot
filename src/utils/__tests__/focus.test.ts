import { claimEscapeFromField, isTypingTarget } from '../focus';

const escapeFrom = (target: HTMLElement): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, 'target', { value: target });
  return event;
};

describe('isTypingTarget', () => {
  it('counts text entry elements as fields', () => {
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    Object.defineProperty(editable, 'isContentEditable', { value: true });

    expect(isTypingTarget(document.createElement('input'))).toBe(true);
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true);
    expect(isTypingTarget(document.createElement('select'))).toBe(true);
    expect(isTypingTarget(editable)).toBe(true);
  });

  it('does not count buttons or non-elements', () => {
    expect(isTypingTarget(document.createElement('button'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('claimEscapeFromField', () => {
  it('claims an Escape from a field once, for the innermost section', () => {
    const event = escapeFrom(document.createElement('input'));

    expect(claimEscapeFromField(event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(claimEscapeFromField(event)).toBe(false);
  });

  it('leaves an Escape from a button alone', () => {
    const event = escapeFrom(document.createElement('button'));

    expect(claimEscapeFromField(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });
});
