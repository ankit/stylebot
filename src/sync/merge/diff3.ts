/*
 * Line-level three-way merge, ported from node-diff3 (MIT, Project
 * Synchrotron). Vendored because the package publishes only an `exports` map,
 * which webpack 4 and this tsconfig's node resolution cannot read.
 */

type LcsCandidate = {
  buffer1index: number;
  buffer2index: number;
  chain: LcsCandidate | null;
};

/**
 * Longest common subsequence of two line arrays, as a chain of matched index
 * pairs ending at the last match.
 */
const lcs = (buffer1: Array<string>, buffer2: Array<string>): LcsCandidate => {
  const equivalenceClasses: Record<string, Array<number>> = Object.create(null);

  buffer2.forEach((item, j) => {
    if (equivalenceClasses[item]) {
      equivalenceClasses[item].push(j);
    } else {
      equivalenceClasses[item] = [j];
    }
  });

  const candidates: Array<LcsCandidate> = [
    { buffer1index: -1, buffer2index: -1, chain: null },
  ];

  buffer1.forEach((item, i) => {
    const buffer2indices = equivalenceClasses[item] || [];
    let r = 0;
    let c = candidates[0];

    for (const j of buffer2indices) {
      let s;
      for (s = r; s < candidates.length; s++) {
        if (
          candidates[s].buffer2index < j &&
          (s === candidates.length - 1 || candidates[s + 1].buffer2index > j)
        ) {
          break;
        }
      }

      if (s < candidates.length) {
        const newCandidate = {
          buffer1index: i,
          buffer2index: j,
          chain: candidates[s],
        };
        if (r === candidates.length) {
          candidates.push(c);
        } else {
          candidates[r] = c;
        }
        r = s + 1;
        c = newCandidate;
        if (r === candidates.length) {
          break;
        }
      }
    }

    candidates[r] = c;
  });

  return candidates[candidates.length - 1];
};

type Mismatch = {
  buffer1Start: number;
  buffer1Length: number;
  buffer2Start: number;
  buffer2Length: number;
};

/**
 * Offsets and lengths of the chunks where the two buffers disagree.
 */
const diffIndices = (
  buffer1: Array<string>,
  buffer2: Array<string>
): Array<Mismatch> => {
  const result: Array<Mismatch> = [];
  let tail1 = buffer1.length;
  let tail2 = buffer2.length;

  for (
    let candidate: LcsCandidate | null = lcs(buffer1, buffer2);
    candidate !== null;
    candidate = candidate.chain
  ) {
    const mismatchLength1 = tail1 - candidate.buffer1index - 1;
    const mismatchLength2 = tail2 - candidate.buffer2index - 1;
    tail1 = candidate.buffer1index;
    tail2 = candidate.buffer2index;

    if (mismatchLength1 || mismatchLength2) {
      result.push({
        buffer1Start: tail1 + 1,
        buffer1Length: mismatchLength1,
        buffer2Start: tail2 + 1,
        buffer2Length: mismatchLength2,
      });
    }
  }

  return result.reverse();
};

type Hunk = {
  side: 'a' | 'b';
  oStart: number;
  oLength: number;
  abStart: number;
  abLength: number;
};

export type MergeRegion =
  | { ok: Array<string> }
  | { conflict: { a: Array<string>; o: Array<string>; b: Array<string> } };

/**
 * Merges `a` and `b` against their common ancestor `o`, line by line. Regions
 * only one side changed apply cleanly; regions both sides changed differently
 * come back as a conflict carrying all three versions.
 */
export const diff3Merge = (
  a: Array<string>,
  o: Array<string>,
  b: Array<string>
): Array<MergeRegion> => {
  const hunks: Array<Hunk> = [];

  const addHunks = (side: 'a' | 'b', mismatches: Array<Mismatch>) => {
    mismatches.forEach(m => {
      hunks.push({
        side,
        oStart: m.buffer1Start,
        oLength: m.buffer1Length,
        abStart: m.buffer2Start,
        abLength: m.buffer2Length,
      });
    });
  };

  addHunks('a', diffIndices(o, a));
  addHunks('b', diffIndices(o, b));
  hunks.sort((x, y) => x.oStart - y.oStart);

  const results: Array<MergeRegion> = [];
  let okBuffer: Array<string> = [];
  let currOffset = 0;

  const flushOk = () => {
    if (okBuffer.length) {
      results.push({ ok: okBuffer });
    }
    okBuffer = [];
  };

  const advanceTo = (endOffset: number) => {
    if (endOffset > currOffset) {
      okBuffer.push(...o.slice(currOffset, endOffset));
      currOffset = endOffset;
    }
  };

  const sameLines = (x: Array<string>, y: Array<string>) =>
    x.length === y.length && x.every((line, i) => line === y[i]);

  while (hunks.length) {
    const first = hunks.shift() as Hunk;
    const regionStart = first.oStart;
    let regionEnd = first.oStart + first.oLength;
    const regionHunks = [first];
    advanceTo(regionStart);

    while (hunks.length) {
      const next = hunks[0];
      if (next.oStart > regionEnd) {
        break;
      }

      regionEnd = Math.max(regionEnd, next.oStart + next.oLength);
      regionHunks.push(hunks.shift() as Hunk);
    }

    if (regionHunks.length === 1) {
      const buffer = first.side === 'a' ? a : b;
      okBuffer.push(
        ...buffer.slice(first.abStart, first.abStart + first.abLength)
      );
    } else {
      // [abMin, abMax, oMin, oMax] per side over every hunk in the region
      const bounds = {
        a: [a.length, -1, o.length, -1],
        b: [b.length, -1, o.length, -1],
      };

      regionHunks.forEach(hunk => {
        const bound = bounds[hunk.side];
        bound[0] = Math.min(hunk.abStart, bound[0]);
        bound[1] = Math.max(hunk.abStart + hunk.abLength, bound[1]);
        bound[2] = Math.min(hunk.oStart, bound[2]);
        bound[3] = Math.max(hunk.oStart + hunk.oLength, bound[3]);
      });

      const aStart = bounds.a[0] + (regionStart - bounds.a[2]);
      const aEnd = bounds.a[1] + (regionEnd - bounds.a[3]);
      const bStart = bounds.b[0] + (regionStart - bounds.b[2]);
      const bEnd = bounds.b[1] + (regionEnd - bounds.b[3]);

      const aContent = a.slice(aStart, aEnd);
      const bContent = b.slice(bStart, bEnd);

      if (sameLines(aContent, bContent)) {
        okBuffer.push(...aContent);
      } else {
        flushOk();
        results.push({
          conflict: {
            a: aContent,
            o: o.slice(regionStart, regionEnd),
            b: bContent,
          },
        });
      }
    }

    currOffset = regionEnd;
  }

  advanceTo(o.length);
  flushOk();

  return results;
};
