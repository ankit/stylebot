/**
 * MediaWiki embeds this flag on every page — true only for the wiki's
 * designated portal/home page, e.g. Main_Page.
 */
export const isMediaWikiMainPage = (): boolean =>
  [...document.scripts].some(script =>
    /"wgIsMainPage"\s*:\s*true/.test(script.textContent ?? '')
  );
