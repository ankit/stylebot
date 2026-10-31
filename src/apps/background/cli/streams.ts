import { watchStreams } from './mode';
import type { CliStreams } from './types';

export const streamCommands: CliStreams = { ...watchStreams };
