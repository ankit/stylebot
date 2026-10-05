import Vue from 'vue';

import type { ChatTurn } from '@stylebot/types';

import {
  getStreamRequest,
  getFailedMessage,
  getAssistantTurn,
  getRoundsTurn,
  getStoppedTurn,
  getUserTurn,
} from './chat-reply';

const page = {
  url: 'example.com',
  href: 'https://example.com/post',
  title: 'A "quoted" post',
  css: 'a { color: red; }',
  outline: 'body\n  main',
  pageCss: ':root { --fg: #111 }',
};

const edit = {
  selector: 'a',
  declarations: [{ property: 'color', value: 'blue' }],
};

describe('getStreamRequest', () => {
  it('describes the page in the system prompt', () => {
    const { system } = getStreamRequest(page, []);

    expect(system).toContain(
      `<page url="https://example.com/post" title="A 'quoted' post">`
    );
    expect(system).toContain(':root { --fg: #111 }');
    expect(system).toContain('a { color: red; }');
  });

  it('names the picked element', () => {
    const { system } = getStreamRequest({ ...page, selector: 'h1.title' }, []);

    expect(system).toContain('`h1.title`');
  });

  it('falls back to the site when the page has no address', () => {
    const { system } = getStreamRequest({ ...page, href: '' }, []);

    expect(system).toContain('<page url="example.com"');
  });

  it('sends plain copies of the turns', () => {
    const turns: Array<ChatTurn> = Vue.observable([
      { role: 'user', id: '1', text: 'hi' },
    ]);
    const request = getStreamRequest(page, turns);

    expect(request.turns).toEqual([{ role: 'user', id: '1', text: 'hi' }]);
    expect(request.turns[0]).not.toBe(turns[0]);
    expect(Object.keys(request.turns[0])).not.toContain('__ob__');
  });
});

describe('getAssistantTurn', () => {
  const reply = { id: 'r1', model: 'm', edits: [edit], previous: [] };

  it('is applied when the reply made edits', () => {
    expect(getAssistantTurn(reply, '  Done.  ')).toEqual({
      role: 'assistant',
      id: 'r1',
      text: 'Done.',
      edits: [edit],
      previous: [],
      applied: true,
      model: 'm',
      usage: undefined,
    });
  });

  it('is not applied without edits', () => {
    expect(getAssistantTurn({ ...reply, edits: [] }, 'Hm').applied).toBe(false);
  });

  it('keeps the replay only when the provider sent one', () => {
    expect(getAssistantTurn(reply, '')).not.toHaveProperty('replay');
    expect(getAssistantTurn({ ...reply, replay: [1] }, '').replay).toEqual([1]);
  });
});

describe('getUserTurn', () => {
  const image = {
    dataUrl: 'data:image/png;base64,AA',
    mediaType: 'image/png' as const,
    name: '',
    size: 1,
  };

  it('keeps the picked element and image with the message', () => {
    expect(getUserTurn({ text: ' Bigger ', scope: 'h1', image })).toMatchObject(
      { role: 'user', text: 'Bigger', scope: 'h1', image }
    );
  });

  it('leaves out what the message went without', () => {
    const turn = getUserTurn({ text: 'Bigger' });

    expect(turn).not.toHaveProperty('scope');
    expect(turn).not.toHaveProperty('image');
  });
});

describe('getStoppedTurn', () => {
  it('keeps the text that came in, with no edits', () => {
    expect(getStoppedTurn(' Making it ', 'm')).toMatchObject({
      role: 'assistant',
      text: 'Making it',
      edits: [],
      applied: false,
      stopped: true,
      model: 'm',
    });
  });
});

describe('getFailedMessage', () => {
  const user: ChatTurn = { role: 'user', id: '2', text: 'again' };
  const reply = getAssistantTurn(
    { id: '1', model: 'm', edits: [], previous: [] },
    'ok'
  );

  it('splits off the last message when it got no reply', () => {
    expect(getFailedMessage([reply, { ...user, scope: 'h1' }])).toEqual({
      turns: [reply],
      message: { text: 'again', scope: 'h1', image: undefined },
    });
  });

  it('is null when the thread ends with a reply', () => {
    expect(getFailedMessage([user, reply])).toBeNull();
    expect(getFailedMessage([])).toBeNull();
  });
});

describe('getRoundsTurn', () => {
  const first = {
    text: 'Made it dark.',
    edits: [
      {
        selector: 'body',
        declarations: [{ property: 'color', value: '#eee' }],
      },
    ],
    previous: [{ selector: 'body', property: 'color', value: null }],
    matches: [1],
    usage: { inputTokens: 10, outputTokens: 5 },
  };

  it('is the plain turn for one call the check found nothing in', () => {
    const turn = getRoundsTurn('a1', 'm', [first]);

    expect(turn).not.toHaveProperty('rounds');
    expect(turn.text).toBe('Made it dark.');
  });

  it('combines a fix into one turn that Undo takes back as a whole', () => {
    const problem = {
      type: 'clashing' as const,
      selector: '.card',
      count: 1,
      background: '#ffffff',
      page: 'dark' as const,
    };
    const fix = {
      text: 'Darkened the cards.',
      edits: [
        {
          selector: '.card',
          declarations: [{ property: 'background', value: '#222' }],
        },
        {
          selector: 'body',
          declarations: [{ property: 'color', value: '#ddd' }],
        },
      ],
      previous: [
        { selector: '.card', property: 'background', value: null },
        { selector: 'body', property: 'color', value: '#eee' },
      ],
      matches: [3, 1],
      usage: { inputTokens: 20, outputTokens: 7 },
    };

    const turn = getRoundsTurn('a1', 'm', [
      { ...first, problems: [problem] },
      fix,
    ]);

    expect(turn.text).toBe('Made it dark.\n\nDarkened the cards.');
    expect(turn.edits).toEqual([...first.edits, ...fix.edits]);
    expect(turn.matches).toEqual([1, 3, 1]);
    expect(turn.previous).toEqual([
      { selector: 'body', property: 'color', value: null },
      { selector: '.card', property: 'background', value: null },
    ]);
    expect(turn.usage).toEqual({
      inputTokens: 30,
      outputTokens: 12,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    });
    expect(turn.rounds?.map(round => round.problems)).toEqual([
      [problem],
      undefined,
    ]);
  });
});
