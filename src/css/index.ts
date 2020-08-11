export {
  getFilterEffectValueForPage,
  getCssAfterApplyingFilterEffectToPage,
} from './filter';

export {
  injectCSSIntoDocument,
  injectRootIntoDocument,
  removeCSSFromDocument,
} from './inject-style';

export {
  getSelector,
  getIdBasedSelector,
  getClassBasedSelector,
  getTagNameBasedSelector,
  validateSelector,
} from './selector';

export { addGoogleWebFont, cleanGoogleWebFonts } from './webfont';
export { addDeclaration, appendImportantToDeclarations } from './declaration';
export { getRule, addEmptyRule } from './rule';
