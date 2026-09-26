export { default as BackgroundPageUtils } from './utils';
export { getStylesForPage } from './page';
export { isEquivalentStyle, isEquivalentStyleMap } from './equivalence';
export { isForceImportant } from './force-important';
export {
  STYLES_KEY,
  STYLES_METADATA_KEY,
  COMPILED_STYLES_KEY,
  COMPILED_STYLES_VERSION,
  isCompiledStylesCurrent,
} from './storage';
