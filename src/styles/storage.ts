export const STYLES_KEY = 'styles';
export const STYLES_METADATA_KEY = 'styles-metadata';
export const COMPILED_STYLES_KEY = 'styles-compiled';

// Bump whenever compileStyle's output changes, so copies stored by an older
// version are rebuilt rather than injected as they are.
export const COMPILED_STYLES_VERSION = 1;

/**
 * Whether a stored compiled copy was built by this compiler from the styles
 * stored at `revision`, so it can be injected or reused as it is.
 */
export const isCompiledStylesCurrent = (
  stored: { version: number; revision: string } | undefined,
  revision: string
): boolean =>
  stored?.version === COMPILED_STYLES_VERSION && stored.revision === revision;
