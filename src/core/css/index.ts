export {
  getFilterEffectValueForPage,
  getCssAfterApplyingFilterEffectToPage,
} from './filter';

export { injectCSSIntoDocument, removeCSSFromDocument } from './inject-style';
export { compileStyle } from './compile';

export { getCssWithExpandedImports } from './import';

export {
  getSelector,
  escapeSelectorToken,
  getTestIdBasedSelector,
  getNameBasedSelector,
  getNonHashedClassBasedSelector,
  getStableClassPartsSelector,
  getStableClassMatcher,
  getStableSelector,
  getFragileSelector,
  getIdBasedSelector,
  getClassBasedSelector,
  getTagNameBasedSelector,
  getAncestorBasedSelector,
  splitSelectorList,
  validateSelector,
  getBodyChildSelectors,
  getSelectorCandidates,
  dedupeByMatches,
  byReach,
} from './selector';
export { looksGeneratedId, looksMinified } from './hashed-class';

export {
  addGoogleWebFont,
  addGoogleWebFontImport,
  cleanGoogleWebFonts,
  googleWebFontExists,
} from './webfont';
export {
  getPrimaryFontFamily,
  getTokenAtCaret,
  isFontFamilyProperty,
  quoteFamily,
  replaceToken,
  unquoteFamily,
} from './font-family';
export type { FontValueToken } from './font-family';
export {
  addDeclaration,
  getDeclarationValue,
  markDeclarationsImportant,
  withoutImportant,
} from './declaration';
export {
  getRule,
  findRule,
  isNestedRule,
  walkUnnestedRules,
  withOwnDeclarationsOnly,
  getRuleForSelector,
  getDeclarationsForSelector,
  getExistingSelector,
  getMatchingSelectors,
  splitSelectorFromGroup,
  addEmptyRule,
  removeEmptyRules,
  removeRule,
  countRules,
} from './rule';

export { getAlreadyUsedColors } from './already-used-colors';
export type { RoleColorGroups } from './already-used-colors';
export { toHexColors } from './to-hex-colors';
export { compareSpecificity, getSpecificity } from './specificity';
export type { Specificity } from './specificity';
export { mergeShorthands } from './shorthands';
