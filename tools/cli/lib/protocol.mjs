import { CLI_VERSION } from './package.mjs';

/*
 * The version of the request and response shapes the CLI and the extension
 * share, which must be equal on both sides. Bump it here and in the
 * extension's copy when a command's arguments or result change incompatibly.
 */
export const PROTOCOL = 1;

export const NPM_PACKAGE = '@stylebot/cli';

/**
 * What each request carries, for the extension to refuse one it can't run.
 */
export const cliStamp = () => ({ protocol: PROTOCOL, version: CLI_VERSION });

/**
 * Why the extension that sent a response can't work with this CLI, naming
 * which side to update, or undefined when they're compatible.
 */
export const incompatibility = ({ protocol, version }) => {
  if (protocol === PROTOCOL) {
    return undefined;
  }

  // An extension from before the handshake sends no protocol.
  if (typeof protocol !== 'number' || protocol < PROTOCOL) {
    return `Your browser's Stylebot${
      version ? ` (${version})` : ''
    } is too old for this CLI (${CLI_VERSION}). Update Stylebot in your browser.`;
  }

  return `This CLI (${CLI_VERSION}) is too old for your browser's Stylebot (${version}). Update it: npm update -g ${NPM_PACKAGE}`;
};
