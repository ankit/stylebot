import { toggleGrayscale } from '../common';

describe('toggleGrayscale', () => {
  it('dispatches percent as a string when turning grayscale on', () => {
    const dispatch = jest.fn();

    toggleGrayscale({ getters: { grayscale: 0 }, dispatch });

    expect(dispatch).toHaveBeenCalledWith('applyFilter', {
      effectName: 'grayscale',
      percent: '100',
    });
  });

  it('dispatches percent as a string when turning grayscale off', () => {
    const dispatch = jest.fn();

    toggleGrayscale({ getters: { grayscale: 100 }, dispatch });

    expect(dispatch).toHaveBeenCalledWith('applyFilter', {
      effectName: 'grayscale',
      percent: '0',
    });
  });
});
