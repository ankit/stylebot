import { wins } from './effective-declarations';

describe('wins', () => {
  const candidate = (
    specificity: [number, number, number, number],
    important = false
  ) => ({ important, specificity });

  it('takes the first candidate for a property', () => {
    expect(wins(candidate([0, 0, 0, 1]), undefined)).toBe(true);
  });

  it('lets !important beat a more specific normal declaration', () => {
    expect(wins(candidate([0, 0, 0, 1], true), candidate([0, 1, 0, 0]))).toBe(
      true
    );
    expect(wins(candidate([0, 1, 0, 0]), candidate([0, 0, 0, 1], true))).toBe(
      false
    );
  });

  it('lets the more specific declaration win, and the later on a tie', () => {
    expect(wins(candidate([0, 0, 1, 0]), candidate([0, 0, 0, 2]))).toBe(true);
    expect(wins(candidate([0, 0, 0, 2]), candidate([0, 0, 1, 0]))).toBe(false);
    expect(wins(candidate([0, 0, 1, 0]), candidate([0, 0, 1, 0]))).toBe(true);
  });
});
