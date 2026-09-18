import store from '../index';
import * as utils from '../../utils';

jest.mock('../../utils');

const modifiedTime = '2026-01-01T00:00:00.000+00:00';

describe('setStyleReadability', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('turns readability off and keeps a style that has css', () => {
    store.state.styles = {
      'example.com': {
        css: 'p { color: red; }',
        enabled: true,
        readability: true,
        modifiedTime,
      },
    };

    store.dispatch('setStyleReadability', {
      url: 'example.com',
      value: false,
    });

    expect(store.state.styles['example.com']).toEqual({
      css: 'p { color: red; }',
      enabled: true,
      readability: false,
      modifiedTime,
    });

    expect(utils.setAllStyles).toHaveBeenCalledWith(store.state.styles);
  });

  it('deletes a style that only existed to carry the readability flag', () => {
    store.state.styles = {
      'example.com': { css: '', enabled: true, readability: true, modifiedTime },
      'other.com': {
        css: 'p {}',
        enabled: true,
        readability: false,
        modifiedTime,
      },
    };

    store.dispatch('setStyleReadability', {
      url: 'example.com',
      value: false,
    });

    expect(store.state.styles['example.com']).toBeUndefined();
    expect(store.state.styles['other.com']).toBeDefined();
    expect(utils.setAllStyles).toHaveBeenCalledWith(store.state.styles);
  });

  it('keeps an empty style when readability is turned on', () => {
    store.state.styles = {
      'example.com': {
        css: '',
        enabled: true,
        readability: false,
        modifiedTime,
      },
    };

    store.dispatch('setStyleReadability', { url: 'example.com', value: true });

    expect(store.state.styles['example.com'].readability).toBe(true);
  });

  it('does not change modifiedTime', () => {
    store.state.styles = {
      'example.com': {
        css: 'p {}',
        enabled: true,
        readability: true,
        modifiedTime,
      },
    };

    store.dispatch('setStyleReadability', {
      url: 'example.com',
      value: false,
    });

    expect(store.state.styles['example.com'].modifiedTime).toBe(modifiedTime);
  });

  it('ignores an unknown url', () => {
    store.state.styles = {};

    store.dispatch('setStyleReadability', {
      url: 'missing.com',
      value: false,
    });

    expect(utils.setAllStyles).not.toHaveBeenCalled();
  });
});
