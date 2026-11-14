import { describeElement, describeSize } from './describe-element';

const element = (html: string): Element => {
  const container = document.createElement('div');
  container.innerHTML = html;

  return container.firstElementChild as Element;
};

describe('describeElement', () => {
  it('names the tag, id and classes', () => {
    expect(
      describeElement(element('<a id="top" class="storylink big"></a>'))
    ).toBe('a#top.storylink.big');
  });

  it('names a bare tag in lowercase', () => {
    expect(describeElement(element('<SPAN></SPAN>'))).toBe('span');
  });

  it('shows hashed classes as they are', () => {
    expect(
      describeElement(element('<div class="css-1q2w3e card"></div>'))
    ).toBe('div.css-1q2w3e.card');
  });

  it('shows a partly hashed class in full', () => {
    expect(
      describeElement(
        element(
          '<span class="contextCrumbLast__l2P28s prc-Button-Label-pTQ3x"></span>'
        )
      )
    ).toBe('span.contextCrumbLast__l2P28s.prc-Button-Label-pTQ3x');
  });

  it('shows the first three classes only', () => {
    expect(describeElement(element('<li class="a b c d"></li>'))).toBe(
      'li.a.b.c'
    );
  });
});

describe('describeSize', () => {
  it('rounds the rendered size', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () =>
      ({ width: 120.4, height: 23.6 } as DOMRect);

    expect(describeSize(el)).toBe('120 × 24');
  });
});
