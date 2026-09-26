import { buildSystemPrompt } from '../prompt';

const context = {
  url: 'https://example.com/',
  title: 'Example "site"',
  outline: 'h1 "Hello"',
  css: '',
};

describe('buildSystemPrompt', () => {
  it('includes the page CSS and points colour changes at its variables', () => {
    const prompt = buildSystemPrompt({
      ...context,
      pageCss: '/* Variables */\n:root { --bg: #fff }',
    });

    expect(prompt).toContain(
      '<page-css>\n/* Variables */\n:root { --bg: #fff }\n</page-css>'
    );
    expect(prompt).toContain("Always check the page's CSS variables first");
  });

  it('says so when none of the page CSS could be read', () => {
    expect(buildSystemPrompt({ ...context, pageCss: '' })).toContain(
      '<page-css>\n(none readable)\n</page-css>'
    );
  });

  it('names the picked element', () => {
    expect(
      buildSystemPrompt({ ...context, pageCss: '', selector: '.title' })
    ).toContain('picked the element matching `.title`');
  });
});
