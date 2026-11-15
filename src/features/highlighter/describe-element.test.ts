import type { NamePart } from './describe-element';
import { describeElement } from './describe-element';

const element = (html: string): Element => {
  const container = document.createElement('div');
  container.innerHTML = html;

  return container.firstElementChild as Element;
};

const text = (parts: Array<NamePart>): string =>
  parts.map(part => part.map(span => span.text).join('')).join('');

/**
 * The name with generated text in brackets, e.g. `div[.css-1q2w3e]`.
 */
const marked = (parts: Array<NamePart>): string =>
  parts
    .map(part =>
      part
        .map(span => (span.generated ? `[${span.text}]` : span.text))
        .join('')
        .replace(/\]\[/g, '')
    )
    .join('');

describe('describeElement', () => {
  it('names the tag, id and classes, each as its own part', () => {
    const parts = describeElement(
      element('<a id="top" class="storylink big"></a>')
    );

    expect(parts).toHaveLength(4);
    expect(text(parts)).toBe('a#top.storylink.big');
    expect(marked(parts)).toBe('a#top.storylink.big');
  });

  it('names a bare tag in lowercase', () => {
    expect(text(describeElement(element('<SPAN></SPAN>')))).toBe('span');
  });

  it('marks a generated class as a whole', () => {
    expect(
      marked(describeElement(element('<div class="card css-1q2w3e"></div>')))
    ).toBe('div.card[.css-1q2w3e]');
  });

  it('marks only the hash in a partly hashed class', () => {
    expect(
      marked(
        describeElement(
          element(
            '<span class="contextCrumbLast__l2P28s prc-Button-Label-pTQ3x Header_nav__a1B2c"></span>'
          )
        )
      )
    ).toBe(
      'span.contextCrumbLast__[l2P28s].prc-Button-Label-[pTQ3x].Header_nav__[a1B2c]'
    );
  });

  it('marks the hash and counter around an authored name', () => {
    expect(
      marked(
        describeElement(
          element(
            '<div class="_card_1wfme_1 Wr7_RG_mastheadContainer SidebarAbout-module_eqNI3a_websiteLink"></div>'
          )
        )
      )
    ).toBe(
      'div._card_[1wfme_1].[Wr7_RG]_mastheadContainer.SidebarAbout-module_[eqNI3a]_websiteLink'
    );
  });

  it('marks a generated id', () => {
    expect(
      marked(
        describeElement(
          element('<div id="tsuid_hsLJaqLJBPu9ruEP7uOYkAo_91"></div>')
        )
      )
    ).toBe('div[#tsuid_hsLJaqLJBPu9ruEP7uOYkAo_91]');
  });

  it('shows the first three classes only', () => {
    expect(text(describeElement(element('<li class="a b c d"></li>')))).toBe(
      'li.a.b.c'
    );
  });

  it('names authored classes before generated ones, in the page order', () => {
    expect(
      marked(
        describeElement(
          element(
            '<li class="css-1q2w3e item jsx-123 sc-abc active selected"></li>'
          )
        )
      )
    ).toBe('li.item.active.selected');

    expect(
      marked(describeElement(element('<li class="css-1q2w3e item"></li>')))
    ).toBe('li[.css-1q2w3e].item');
  });
});
