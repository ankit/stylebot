import type { CliThreadEntry, CliTurn } from '@stylebot/types';

import {
  circled,
  lastUndoableSave,
  summarizeTurn,
  threadSteps,
} from './thread';

const MESSAGES: Record<string, string> = {
  ran_count_one: 'ran $1 command',
  ran_count_other: 'ran $1 commands',
  saved_count_one: 'saved $1 time',
  saved_count_other: 'saved $1 times',
};

beforeEach(() => {
  global.chrome = {
    i18n: {
      getMessage: (key: string, [count]: Array<string>) =>
        MESSAGES[key].replace('$1', count),
    },
  } as unknown as typeof chrome;
});

const turn = (steps: CliTurn['steps']): CliTurn => ({
  kind: 'turn',
  id: 1,
  steps,
});

const command = (id: number) => ({
  kind: 'command' as const,
  id,
  text: 'outline',
});

const save = (id: number, undone = false) => ({
  kind: 'save' as const,
  id,
  url: 'example.com',
  undone,
});

describe('summarizeTurn', () => {
  it('counts the commands a turn ran', () => {
    expect(summarizeTurn(turn([command(1)]))).toBe('ran 1 command');
    expect(summarizeTurn(turn([command(1), command(2)]))).toBe(
      'ran 2 commands'
    );
  });

  it('adds how many times it saved', () => {
    expect(
      summarizeTurn(turn([command(1), save(2), command(3), save(4)]))
    ).toBe('ran 2 commands · saved 2 times');
  });
});

describe('lastUndoableSave', () => {
  it('is the last save not yet undone', () => {
    expect(lastUndoableSave([save(1), save(2), save(3, true)])?.id).toBe(2);
    expect(lastUndoableSave([command(1), save(2, true)])).toBeUndefined();
  });
});

describe('threadSteps', () => {
  it("lists every turn's steps, past notes and replies", () => {
    const thread: Array<CliThreadEntry> = [
      turn([command(1)]),
      { kind: 'note', id: 2, text: 'bigger', marks: [1] },
      { kind: 'reply', id: 3, text: 'done' },
      turn([save(4)]),
    ];

    expect(threadSteps(thread).map(step => step.id)).toEqual([1, 4]);
  });
});

describe('circled', () => {
  it('circles numbers up to 20', () => {
    expect([1, 2, 20].map(circled).join('')).toBe('①②⑳');
    expect(circled(21)).toBe('(21)');
  });
});
