import { diff3Merge } from '../diff3';

const lines = (text: string) => text.split('\n');

describe('diff3Merge', () => {
  it('returns the base untouched when neither side changed', () => {
    const o = lines('a\nb\nc');

    expect(diff3Merge(o, o, o)).toEqual([{ ok: ['a', 'b', 'c'] }]);
  });

  it('applies a change made on one side only', () => {
    const o = lines('a\nb\nc');
    const a = lines('a\nB\nc');

    expect(diff3Merge(a, o, o)).toEqual([{ ok: ['a', 'B', 'c'] }]);
    expect(diff3Merge(o, o, a)).toEqual([{ ok: ['a', 'B', 'c'] }]);
  });

  it('applies non-overlapping changes from both sides', () => {
    const o = lines('a\nb\nc\nd\ne');
    const a = lines('A\nb\nc\nd\ne');
    const b = lines('a\nb\nc\nd\nE');

    expect(diff3Merge(a, o, b)).toEqual([{ ok: ['A', 'b', 'c', 'd', 'E'] }]);
  });

  it('applies an insertion on one side and a deletion on the other', () => {
    const o = lines('a\nb\nc');
    const a = lines('a\nb\nc\nd');
    const b = lines('b\nc');

    expect(diff3Merge(a, o, b)).toEqual([{ ok: ['b', 'c', 'd'] }]);
  });

  it('reports a conflict when both sides changed the same lines differently', () => {
    const o = lines('a\nb\nc');
    const a = lines('a\nB\nc');
    const b = lines('a\nb2\nc');

    expect(diff3Merge(a, o, b)).toEqual([
      { ok: ['a'] },
      { conflict: { a: ['B'], o: ['b'], b: ['b2'] } },
      { ok: ['c'] },
    ]);
  });

  it('treats the same change made on both sides as no conflict', () => {
    const o = lines('a\nb\nc');
    const a = lines('a\nB\nc');

    expect(diff3Merge(a, o, a)).toEqual([{ ok: ['a', 'B', 'c'] }]);
  });

  it('conflicts when both sides append different lines at the end', () => {
    const o = lines('a');
    const a = lines('a\nb');
    const b = lines('a\nc');

    expect(diff3Merge(a, o, b)).toEqual([
      { ok: ['a'] },
      { conflict: { a: ['b'], o: [], b: ['c'] } },
    ]);
  });

  it('conflicts everything when there is no common ancestor', () => {
    expect(diff3Merge(lines('x'), [], lines('y'))).toEqual([
      { conflict: { a: ['x'], o: [], b: ['y'] } },
    ]);
  });
});
