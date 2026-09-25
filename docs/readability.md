# Readability

Readability mode turns an article into a clean reading view, built on [Defuddle](https://github.com/kepano/defuddle) for article extraction.

The content scripts carry only the light parts: deciding whether a page qualifies, the loading screen, and turning the reader on and off. The reader itself is a separate bundle, loaded on demand once a page qualifies, so pages that never use it don't pay for it.

- **Eligibility** decides whether the reader should run on a page, from URL rules, MediaWiki detection and how dense the page's content is.
- **Applying** swaps the live page for the reader, mounted in a shadow DOM, and caches the original document so turning the reader off restores it exactly.
- **The loading screen** is themed to match the reader and covers the page while the article is extracted, so there's no flash of the original.
