export type CliRequest = {
  id: number;
  command: string;
  args: Record<string, unknown>;
  protocol?: number;
  version?: string;
};

export type CliResponse = { id: number; protocol: number; version: string } & (
  | { result: unknown }
  | { error: string }
);

export type CliCommands = Record<
  string,
  (args: Record<string, unknown>) => Promise<unknown>
>;
