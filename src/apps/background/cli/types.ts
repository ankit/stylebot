export type CliRequest = {
  id: number;
  // The CLI went away while this request was still running.
  cancel?: boolean;
  command: string;
  args: Record<string, unknown>;
  protocol?: number;
  version?: string;
};

export type CliResponse = {
  id: number;
  protocol: number;
  version: string;
  // For the CLI to print after the command's output.
  notice?: string;
} & ({ result: unknown } | { error: string });

export type CliCommands = Record<
  string,
  (args: Record<string, unknown>, signal?: AbortSignal) => Promise<unknown>
>;

// A command that sends events as they happen before its result, and stops
// early when the CLI goes away.
export type CliStreams = Record<
  string,
  (
    args: Record<string, unknown>,
    emit: (event: unknown) => void,
    signal: AbortSignal
  ) => Promise<unknown>
>;
