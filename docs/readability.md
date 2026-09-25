# Readability

Readability mode turns an article into a clean reading view, built on [Defuddle](https://github.com/kepano/defuddle) for article extraction.

Code: `src/readability`, aliased as `@stylebot/readability`.

The content scripts import only its light parts (eligibility, the loading screen, apply/remove); the reader itself, `reader.ts`, builds to `readability/reader.js`, which `lifecycle/load-reader.ts` imports on demand once a page qualifies.

- **Eligibility**: whether the reader should run on the current page (URL rules, MediaWiki detection, content-density scoring)
- **Lifecycle**: turning the live page into the reader and back — applying/removing, mounting the Vue app into a shadow DOM, parsing the article, and caching/restoring the original document
- **Loading screen**: the themed screen shown while the reader is being applied
