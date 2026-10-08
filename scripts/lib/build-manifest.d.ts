export type Manifest = {
  key?: string;
  permissions: Array<string>;
  host_permissions: Array<string>;
  content_scripts: Array<{ matches: Array<string> }>;
  [field: string]: unknown;
};

export function buildManifest(
  base: Manifest,
  options: { browser?: string; nodeEnv?: string; preview?: boolean }
): Manifest;

export function supportsCLI(browser?: string): boolean;
