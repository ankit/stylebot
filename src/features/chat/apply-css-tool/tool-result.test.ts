import type { ChatAssistantTurn, ChatReplyRound } from '@stylebot/types';

import { needsFix, roundsOf, toolResultFor } from './tool-result';

const turn = (overrides: Partial<ChatAssistantTurn>): ChatAssistantTurn => ({
  role: 'assistant',
  id: 'a1',
  text: '',
  edits: [
    { selector: '.card', declarations: [] },
    { selector: '.missing', declarations: [] },
    { selector: 'p[', declarations: [] },
  ],
  previous: [],
  applied: true,
  model: 'claude-sonnet-5-5',
  ...overrides,
});

// A one-call reply's call, as the providers pass it.
const only = (
  reply: ChatAssistantTurn
): [ChatAssistantTurn, ChatReplyRound] => [reply, roundsOf(reply)[0]];

describe('toolResultFor', () => {
  it('lists how many elements each selector matched and flags misses', () => {
    expect(toolResultFor(...only(turn({ matches: [1, 0, null] })))).toBe(
      [
        'Applied to the page.',
        'Elements each selector matched:',
        '- .card: 1 element',
        '- .missing: 0 elements',
        '- p[: not a valid selector',
        'Edits whose selector matched nothing changed nothing.',
      ].join('\n')
    );
  });

  it('says only that it applied when the counts weren’t taken', () => {
    expect(toolResultFor(...only(turn({})))).toBe('Applied to the page.');
  });

  it('says the user undid it', () => {
    expect(
      toolResultFor(...only(turn({ applied: false, matches: [1, 1, 1] })))
    ).toBe('Applied, then undone by the user.');
  });
});

describe('toolResultFor with problems', () => {
  it('lists what the page check found after the counts', () => {
    const round = {
      text: '',
      edits: [{ selector: 'body', declarations: [] }],
      matches: [1],
      problems: [
        {
          type: 'unreadable' as const,
          selector: '.meta',
          count: 4,
          of: 4,
          color: '#333333',
          background: '#111111',
          ratio: 1.6,
          coloredBy: '--fg-muted',
        },
        {
          type: 'unreadable' as const,
          selector: 'span.titleline a',
          count: 1,
          of: 30,
          color: '#8ec07c',
          background: '#fe8019',
          ratio: 1.2,
          paintedBy: 'tr:first-child td',
        },
        {
          type: 'clashing' as const,
          selector: '.card',
          count: 1,
          background: '#ffffff',
          page: 'dark' as const,
        },
        {
          type: 'no-effect' as const,
          selector: 'span.tag',
          property: 'width',
          value: '80px',
        },
      ],
    };

    expect(toolResultFor(turn({ rounds: [round] }), round)).toBe(
      [
        'Applied to the page.',
        'Elements each selector matched:',
        '- body: 1 element',
        'Problems the page check found:',
        '- Hard to read: .meta (4 elements), text #333333 set by your `--fg-muted` on #111111, contrast 1.6:1',
        '- Hard to read: span.titleline a (1 of the 30 elements it matches), text #8ec07c on #fe8019 painted by your `tr:first-child td`, contrast 1.2:1',
        '- Still light on a now dark page: .card (1 element), background #ffffff',
        '- No effect: width: 80px on span.tag, overridden by the page or not applicable to that element',
      ].join('\n')
    );
  });
});

describe('needsFix', () => {
  const edits = [{ selector: '.card', declarations: [] }];

  it('asks for a fix when the page check found a problem', () => {
    expect(
      needsFix({
        text: '',
        edits,
        matches: [1],
        problems: [
          {
            type: 'no-effect',
            selector: '.card',
            property: 'width',
            value: '1px',
          },
        ],
      })
    ).toBe(true);
  });

  it('asks for a fix when a selector matched nothing or was invalid', () => {
    expect(needsFix({ text: '', edits, matches: [0] })).toBe(true);
    expect(needsFix({ text: '', edits, matches: [null] })).toBe(true);
  });

  it('leaves a call alone when every selector matched and nothing was found', () => {
    expect(needsFix({ text: '', edits, matches: [3] })).toBe(false);
    expect(needsFix({ text: '', edits: [] })).toBe(false);
  });
});
