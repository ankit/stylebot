import type { Meta, StoryObj } from '@storybook/vue';

import { TURNS, cliTerminal } from '@stylebot/storybook/fixtures/cli-terminal';

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
