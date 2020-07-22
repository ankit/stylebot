import oldFormat from '../__mocks__/old-format';
import newFormat from '../__mocks__/new-format';

import {
  getMigratedStyles,
  default as MigrateOldFormat,
} from '../migrate-old-format';

const mockChromeAPI = (mockGet, mockSet) => {
  global.chrome = {
    storage: {
      local: {
        get: mockGet,
        set: mockSet,
      },
    },
  };
};

describe('MigrateOldFormat', () => {
  describe('getMigratedStyles', () => {
    it("returns empty object when old styles don't exist", async () => {
      const mockSet = jest.fn((_, callback) => callback());
      const mockGet = (_, callback) => {
        callback({});
      };
      mockChromeAPI(mockGet, mockSet);

      const styles = await getMigratedStyles();
      expect(styles).toEqual({});
      expect(mockSet).toHaveBeenCalledTimes(0);
    });

    it('returns styles as is when they are already in the new format', async () => {
      const mockSet = jest.fn((_, callback) => callback());
      const mockGet = (_, callback) => {
        callback({ styles: newFormat });
      };
      mockChromeAPI(mockGet, mockSet);

      const styles = await getMigratedStyles();
      expect(styles).toEqual(newFormat);
      expect(mockSet).toHaveBeenCalledTimes(0);
    });

    it('backs up v2 styles to "backup_v2_styles"', async () => {
      const mockSet = jest.fn((_, callback) => callback());
      const mockGet = (_, callback) => {
        callback({ styles: oldFormat });
      };
      mockChromeAPI(mockGet, mockSet);

      await getMigratedStyles();
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledWith(
        { backup_v2_styles: oldFormat },
        expect.any(Function)
      );
    });

    it('correctly converts old format to new format', async () => {
      const mockSet = jest.fn((_, callback) => callback());
      const mockGet = (_, callback) => {
        callback({ styles: oldFormat });
      };
      mockChromeAPI(mockGet, mockSet);

      const styles = await getMigratedStyles();
      expect(styles).toEqual(newFormat);
    });
  });

  it('correctly invokes chrome.storage.local with new format', async () => {
    const mockSet = jest.fn((_, callback) => callback());
    const mockGet = (_, callback) => {
      callback({ styles: oldFormat });
    };
    mockChromeAPI(mockGet, mockSet);

    const options = { mode: 'basic', contextMenu: true };
    await MigrateOldFormat();

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenNthCalledWith(
      2,
      {
        options,
        styles: newFormat,
      },
      expect.any(Function)
    );
  });
});
