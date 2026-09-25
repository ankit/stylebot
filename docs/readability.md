# Readability

Readability mode turns an article into a clean reading view, built on [Defuddle](https://github.com/kepano/defuddle) for article extraction.

The content scripts import only its light parts (eligibility, the loading screen, apply/remove); the reader itself, `reader.ts`, builds to `readability/reader.js`, which `lifecycle/load-reader.ts` imports on demand once a page qualifies.

| Module                                                | What it does                                                                     |
| :---------------------------------------------------- | :------------------------------------------------------------------------------- |
| [`eligibility`](../src/readability/eligibility)       | Decides whether the reader runs on a page: URL rules, MediaWiki, content density |
| [`lifecycle`](../src/readability/lifecycle)           | Swaps the page for the reader and back, caching the original document            |
| [`loading-screen`](../src/readability/loading-screen) | The themed screen shown while the reader loads                                   |
