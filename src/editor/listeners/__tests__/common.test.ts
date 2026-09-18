import { applyStyles } from '../common';

import mockState from '../../store/__mocks__/state';
import * as stylebotReadability from '@stylebot/readability';
import * as chromeUtils from '../../utils/chrome';

jest.mock('@stylebot/css');
jest.mock('@stylebot/readability');
jest.mock('../../utils/chrome');

const mockCommit = jest.fn();
const mockDispatch = jest.fn();

const style = {
  url: 'example.com',
  css: '',
  enabled: true,
  readability: false,
  modifiedTime: '2026-01-01T00:00:00.000+00:00',
};

describe('applyStyles', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('removes the reader when the matching style is gone', () => {
    applyStyles(
      {
        state: { ...mockState, readability: true },
        commit: mockCommit,
        dispatch: mockDispatch,
      },
      undefined,
      []
    );

    expect(stylebotReadability.removeReadability).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalledWith('setReadability', false);
  });

  it('applies the reader when the matching style turns readability on', () => {
    applyStyles(
      {
        state: { ...mockState, readability: false },
        commit: mockCommit,
        dispatch: mockDispatch,
      },
      { ...style, readability: true },
      []
    );

    expect(stylebotReadability.applyReadability).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalledWith('setReadability', true);
  });

  it('does nothing to the reader when readability is unchanged', () => {
    applyStyles(
      {
        state: { ...mockState, readability: false },
        commit: mockCommit,
        dispatch: mockDispatch,
      },
      style,
      []
    );

    expect(stylebotReadability.applyReadability).not.toHaveBeenCalled();
    expect(stylebotReadability.removeReadability).not.toHaveBeenCalled();
  });

  // setReadability creates a style entry when none exists, so persisting from
  // here would re-create the entry the options page just deleted.
  it('never persists the readability value back', () => {
    applyStyles(
      {
        state: { ...mockState, readability: true },
        commit: mockCommit,
        dispatch: mockDispatch,
      },
      undefined,
      []
    );

    expect(chromeUtils.setReadability).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalledWith(
      'applyReadability',
      expect.anything()
    );
  });

  it('initializes the default style only when there is one', () => {
    applyStyles(
      { state: mockState, commit: mockCommit, dispatch: mockDispatch },
      style,
      []
    );

    expect(mockDispatch).toHaveBeenCalledWith('initializeDefaultStyle', style);

    mockDispatch.mockClear();

    applyStyles(
      { state: mockState, commit: mockCommit, dispatch: mockDispatch },
      undefined,
      []
    );

    expect(mockDispatch).not.toHaveBeenCalledWith(
      'initializeDefaultStyle',
      expect.anything()
    );
  });
});
