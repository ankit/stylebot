export type CliRequest = {
  id: number;
  command: string;
  args: Record<string, unknown>;
};

export type CliResponse =
  | { id: number; result: unknown }
  | { id: number; error: string };

export type CliCommands = Record<
  string,
  (args: Record<string, unknown>) => Promise<unknown>
>;
