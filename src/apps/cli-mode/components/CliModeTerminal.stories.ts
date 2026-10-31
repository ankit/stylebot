import type { Meta, StoryObj } from '@storybook/vue';

import {
  CONVERSATION,
  MARKS,
  TURNS,
  cliTerminal,
} from '@stylebot/storybook/fixtures/cli-terminal';

import CliModeTerminal from './CliModeTerminal.vue';

const meta: Meta = {
  title: 'CLI Mode/Terminal',
  component: CliModeTerminal,
};

export default meta;

export const Queued: StoryObj = cliTerminal();

export const Running: StoryObj = cliTerminal({
  agent: 'connected',
  thread: TURNS,
  activity: 'screenshot',
});

export const WithTurns: StoryObj = cliTerminal({
  agent: 'connected',
  thread: TURNS,
});

export const AgentLeft: StoryObj = cliTerminal({
  agent: 'left',
  thread: TURNS,
});

export const OpenEmpty: StoryObj = cliTerminal({ expanded: true });

export const OpenWithTurns: StoryObj = cliTerminal({
  agent: 'connected',
  thread: TURNS,
  expanded: true,
});

export const OpenWhileRunning: StoryObj = cliTerminal({
  agent: 'connected',
  thread: TURNS,
  activity: "css rule '.titleline > a' --set color=#4fb6b0",
  expanded: true,
});

export const OpenWithMarks: StoryObj = cliTerminal({
  agent: 'connected',
  thread: TURNS,
  marks: MARKS,
  expanded: true,
});

export const OpenWithNotes: StoryObj = cliTerminal({
  agent: 'connected',
  thread: CONVERSATION,
  marks: MARKS,
  expanded: true,
});

export const OpenWhileThinking: StoryObj = cliTerminal({
  agent: 'connected',
  thread: CONVERSATION,
  thinking: true,
  expanded: true,
});

export const Thinking: StoryObj = cliTerminal({
  agent: 'connected',
  thread: CONVERSATION,
  thinking: true,
});

export const Invite: StoryObj = cliTerminal({
  invite: { connectedTo: null },
});

export const InviteToMoveHere: StoryObj = cliTerminal({
  invite: { connectedTo: 'news.ycombinator.com' },
});
