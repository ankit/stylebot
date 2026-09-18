import { StyleMap } from '@stylebot/types';

import mergeStyles from './merge-styles';

const style = (css: string, modifiedTime: string) => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime,
});

describe('mergeStyles', () => {
  it('keeps the remote style when it was modified more recently than local', () => {
    const local: StyleMap = {
      'example.com': style('color: red', '2024-01-01T00:00:00.000Z'),
    };
    const remote: StyleMap = {
      'example.com': style('color: blue', '2024-01-02T00:00:00.000Z'),
    };

    expect(mergeStyles(local, remote)).toEqual({
      'example.com': remote['example.com'],
    });
  });

  it('keeps the local style when it was modified more recently than remote', () => {
    const local: StyleMap = {
      'example.com': style('color: red', '2024-01-02T00:00:00.000Z'),
    };
    const remote: StyleMap = {
      'example.com': style('color: blue', '2024-01-01T00:00:00.000Z'),
    };

    expect(mergeStyles(local, remote)).toEqual({
      'example.com': local['example.com'],
    });
  });

  it('keeps styles that only exist on one side', () => {
    const local: StyleMap = {
      'local-only.com': style('color: red', '2024-01-01T00:00:00.000Z'),
    };
    const remote: StyleMap = {
      'remote-only.com': style('color: blue', '2024-01-01T00:00:00.000Z'),
    };

    expect(mergeStyles(local, remote)).toEqual({
      'local-only.com': local['local-only.com'],
      'remote-only.com': remote['remote-only.com'],
    });
  });
});
