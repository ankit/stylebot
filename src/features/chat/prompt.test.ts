import { INSTRUCTIONS, buildPageContext, withRecentImages } from './prompt';
import type { ChatTurn } from '@stylebot/types';

const context = {
  url: 'https://example.com/',
  title: 'Example "site"',
  outline: 'h1 "Hello"',
  css: '',
};

describe('buildPageContext', () => {
  it('includes the page CSS and points colour changes at its variables', () => {
    const prompt = buildPageContext({
      ...context,
      pageCss: '/* Variables */\n:root { --bg: #fff }',
    });

    expect(prompt).toContain(
      '<page-css>\n/* Variables */\n:root { --bg: #fff }\n</page-css>'
    );
    expect(INSTRUCTIONS).toContain(
      "Always check the page's CSS variables first"
    );
  });

  it('says so when none of the page CSS could be read', () => {
    expect(buildPageContext({ ...context, pageCss: '' })).toContain(
      '<page-css>\n(none readable)\n</page-css>'
    );
  });

  it('names the picked element', () => {
    expect(
      buildPageContext({ ...context, pageCss: '', selector: '.title' })
    ).toContain('picked the element matching `.title`');
  });
});

describe('withRecentImages', () => {
  const image = {
    dataUrl: 'data:image/png;base64,AAAA',
    mediaType: 'image/png' as const,
    name: '',
    size: 3,
  };
  const user = (id: string): ChatTurn => ({
    role: 'user',
    id,
    text: id,
    image,
  });

  const plain = (id: string): ChatTurn => ({ role: 'user', id, text: id });

  it('keeps only the most recent image and notes the older ones', () => {
    const turns = withRecentImages([user('u1'), user('u2'), plain('u3')]);

    expect(turns[0]).toEqual({
      role: 'user',
      id: 'u1',
      text: 'u1\n[An image was attached here; it is no longer shown.]',
    });
    expect(turns[1]).toEqual(user('u2'));
    expect(turns[2]).toEqual(plain('u3'));
  });
});
