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

  it('leaves out hashed classes and marks them with an ellipsis', () => {
    expect(
      describeElement(element('<div class="css-1q2w3e card"></div>'))
    ).toBe('div.card…');
  });

  it('shows a partly hashed class by its authored part', () => {
    expect(
      describeElement(element('<span class="contextCrumbLast__l2P28s"></span>'))
    ).toBe('span.contextCrumbLast__…');
  });

  it('shows the first three classes only', () => {
    expect(describeElement(element('<li class="a b c d"></li>'))).toBe(
      'li.a.b.c…'
    );
  });

  it('leaves out an id the page generates', () => {
    expect(
      describeElement(
        element('<div id="tsuid_hsLJaqLJBPu9ruEP7uOYkAo_91"></div>')
      )
    ).toBe('div');
  });

  it('shortens a long class name', () => {
    expect(
      describeElement(
        element('<p class="a-very-long-class-name-from-a-utility-kit"></p>')
      )
    ).toBe('p.a-very-long-class-name-f…');
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
