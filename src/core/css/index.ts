export {
  getFilterEffectValueForPage,
  getCssAfterApplyingFilterEffectToPage,
} from './filter';

export { injectCSSIntoDocument, removeCSSFromDocument } from './inject-style';
export { compileStyle } from './compile';

export { getCssWithExpandedImports } from './import';

export {
  getSelector,
  getSelectorSuggestions,
  getBodyChildSelectors,
} from './selector/get-selector';
export type {
  SelectorDescription,
  SelectorRole,
} from './selector/describe-selector';
export { getStableClassMatcher } from './selector/element-selectors';
export { getUniqueSelector } from './selector/unique-selectors';
export {
  dedupeByMatches,
  byReach,
  matchesOf,
  sameElements,
} from './selector/reach';
export {
  getStableSelector,
  getFragileSelector,
} from './selector/fragile-selector';
export {
  countSelectorSteps,
  escapeSelectorToken,
  isSimpleSelector,
  splitSelectorList,
  validateSelector,
} from './selector/selector-text';
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
export {
  getColorScheme,
  getPageStyleOptions,
  getStyleOptionValue,
  parseStyleOptions,
} from './style-options';
