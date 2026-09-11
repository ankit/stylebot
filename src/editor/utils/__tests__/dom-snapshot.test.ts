import { getDomSnapshot } from '../dom-snapshot';

describe('getDomSnapshot', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('describes tag, id, and class for simple elements', () => {
    document.body.innerHTML = '<div id="app" class="a b"><span>hi</span></div>';

    const snapshot = getDomSnapshot();

    expect(snapshot).toContain('div#app.a.b');
    expect(snapshot).toContain('span "hi"');
  });

  it('collapses a long run of identically-shaped siblings', () => {
    document.body.innerHTML = Array.from(
      { length: 10 },
      () => '<li class="item">x</li>'
    ).join('');

    const snapshot = getDomSnapshot();
    const renderedOccurrences = snapshot.split('li.item "x"').length - 1;

    // only the first sibling is rendered in full; the rest are summarized
    // (the summary line itself also mentions "<li.item>", hence checking
    // the full rendered-node line rather than the bare "li.item" substring)
    expect(renderedOccurrences).toBe(1);
    expect(snapshot).toContain('9 more');
    expect(snapshot).toContain('same shape');
  });

  it('does not collapse a short run below the repeat threshold', () => {
    document.body.innerHTML = '<li class="item">a</li><li class="item">b</li>';

    const snapshot = getDomSnapshot();

    expect(snapshot).not.toContain('more');
    expect(snapshot.split('li.item').length - 1).toBe(2);
  });

  it('collapses a repeating multi-element group even when each element has a unique id', () => {
    const rows = Array.from(
      { length: 6 },
      (_, i) =>
        `<tr id="row-${i}" class="athing"><td>x</td></tr><tr><td class="subtext">y</td></tr><tr class="spacer"></tr>`
    ).join('');

    document.body.innerHTML = `<table><tbody>${rows}</tbody></table>`;

    const snapshot = getDomSnapshot();

    // ids must not defeat shape matching — the group of 3 repeats 6 times,
    // so it should collapse to one shown group plus a "5 more groups" note
    expect(snapshot).toContain('5 more groups of 3');
    expect(snapshot).not.toContain('row-5');
  });

  it('skips script, style, and the stylebot editor host element', () => {
    document.body.innerHTML =
      '<script>evil()</script><style>.x{}</style><div id="stylebot"><span>hidden</span></div><p>visible</p>';

    const snapshot = getDomSnapshot();

    expect(snapshot).not.toContain('script');
    expect(snapshot).not.toContain('style');
    expect(snapshot).not.toContain('stylebot');
    expect(snapshot).not.toContain('hidden');
    expect(snapshot).toContain('visible');
  });

  it('truncates long leaf text', () => {
    const longText = 'x'.repeat(100);
    document.body.innerHTML = `<p>${longText}</p>`;

    const snapshot = getDomSnapshot();

    expect(snapshot).toContain('…');
    expect(snapshot).not.toContain(longText);
  });
});
