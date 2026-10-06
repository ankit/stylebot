export { isStylableDocument } from './url';
export { getStylesForPage } from './page';
export {
  isEquivalentCss,
  isEquivalentStyle,
  isEquivalentStyleMap,
} from './equivalence';
export { isForceImportant, withForceImportant } from './force-important';
export {
  STYLES_KEY,
  STYLES_METADATA_KEY,
  COMPILED_STYLES_KEY,
  COMPILED_STYLES_VERSION,
  BACKUP_BEFORE_V4_KEY,
  isCompiledStylesCurrent,
} from './storage';
export type { BackupBeforeV4 } from './storage';
export {
  DEFAULT_PROFILE_ID,
  normalizeProfiles,
  expandProfiles,
  collapseProfiles,
  listProfiles,
  hasAnyCss,
  addProfile,
  activateProfile,
  renameProfile,
  removeProfile,
  setProfileCss,
  isProfileNameTaken,
  freeProfileName,
} from './profiles';
export type {
  ExpandedProfiles,
  ProfileSheet,
  ProfileSummary,
} from './profiles';
export { isStyleMap, sanitizeStyleMap } from './style-map';
