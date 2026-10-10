import { parseLocaleConfig } from '../../../scripts/lib/parse-locale-config';

const english = parseLocaleConfig(
  '@restored\n$site$ restored to $time$\n'
).messages;

describe('parseLocaleConfig', () => {
  it('numbers placeholders in the order they appear', () => {
    expect(english.restored.placeholders).toEqual({
      site: { content: '$1' },
      time: { content: '$2' },
    });
  });

  it("numbers a translation's placeholders by the English order", () => {
    const { messages } = parseLocaleConfig(
      '@restored\n$time$ に $site$ を復元しました\n',
      english
    );

    expect(messages.restored.placeholders).toEqual({
      time: { content: '$2' },
      site: { content: '$1' },
    });
  });
});
