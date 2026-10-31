import type { CliModeMessage } from '@stylebot/types';

import { captureWithTerminal } from './terminal';

jest.mock('../../restore-tabs', () => ({
  restoreTab: jest.fn(async () => undefined),
}));

const TAB = 7;
const COVERED = { x: 600, y: 500, width: 300, height: 40 };

let sent: Array<string>;

/**
 * Stands in for a tab's page, answering where its terminal is, if it has one.
 */
const pageWith = (terminal: boolean) => {
  sent = [];
  global.chrome = {
    runtime: {},
    tabs: {
      sendMessage: jest.fn(
        (_tabId: number, { action }: CliModeMessage, reply) => {
          sent.push(action.kind);
          reply(action.kind === 'startCapture' && terminal ? COVERED : null);
        }
      ),
    },
  } as unknown as typeof chrome;
};

describe('captureWithTerminal', () => {
  it('hides the marks for the capture, and shows them after', async () => {
    pageWith(true);

    const capture = jest.fn(async () => {
      sent.push('capture');
      return 'shot';
    });

    expect(await captureWithTerminal(TAB, capture)).toEqual({
      capture: 'shot',
      covered: COVERED,
    });
    await new Promise(resolve => setTimeout(resolve));
    expect(sent).toEqual(['startCapture', 'capture', 'endCapture']);
  });

  it('shows the marks again when the capture fails', async () => {
    pageWith(true);

    await expect(
      captureWithTerminal(TAB, async () => {
        throw new Error('quota');
      })
    ).rejects.toThrow('quota');
    await new Promise(resolve => setTimeout(resolve));
    expect(sent).toEqual(['startCapture', 'endCapture']);
  });

  it('sends nothing after the capture to a page without a terminal', async () => {
    pageWith(false);

    await captureWithTerminal(TAB, async () => 'shot');
    await new Promise(resolve => setTimeout(resolve));
    expect(sent).toEqual(['startCapture']);
  });
});
