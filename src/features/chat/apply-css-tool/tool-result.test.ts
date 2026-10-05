import type { ChatAssistantTurn } from '@stylebot/types';

import { toolResultFor } from './tool-result';

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

describe('toolResultFor', () => {
  it('lists how many elements each selector matched and flags misses', () => {
    expect(toolResultFor(turn({ matches: [1, 0, null] }))).toBe(
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
    expect(toolResultFor(turn({}))).toBe('Applied to the page.');
  });

  it('says the user undid it', () => {
    expect(toolResultFor(turn({ applied: false, matches: [1, 1, 1] }))).toBe(
      'Applied, then undone by the user.'
    );
  });
});
