# Readability

Readability mode turns an article into a clean reading view, built on [Defuddle](https://github.com/kepano/defuddle) for article extraction.

The content scripts carry only the light parts: deciding whether a page qualifies, the loading screen, and turning the reader on and off. The reader itself is a separate bundle, loaded on demand once a page qualifies, so pages that never use it don't pay for it.

- **Eligibility** decides whether the reader should run on a page (below).
- **Applying** swaps the live page for the reader, mounted in a shadow DOM, and caches the original document so turning the reader off restores it exactly.
- **The loading screen** is themed to match the reader and covers the page while the article is extracted, so there's no flash of the original.

## How eligibility works

A page qualifies when it passes three checks, cheapest first. The popup and the editor ask the page whether it qualifies, and mark Readability as articles only when it doesn't.

### 1. The URL

Ruled out straight away, before the page has loaded:

- anything that isn't `http:` or `https:`
- a site's home page (`/`)
- a single short path segment that reads like a section name rather than an article slug, such as `/tech` or `/news`: under 20 characters with fewer than two hyphens
- a short list of app-like sites where the reader never helps, such as GitHub, Gmail and YouTube

This follows the same idea as Firefox's Reader View.

### 2. Checks that need the loaded page

Some checks can only be trusted once the DOM has loaded. Today that's a single one: a MediaWiki site's main page, which MediaWiki flags on every page, is a portal, not an article.

### 3. The content

The last check scores the page's text without running the full extraction. It's adapted from Mozilla's Readability:

- It looks at paragraphs, `<pre>` blocks and `<article>` elements, plus any `<div>` of text split up with `<br>`s.
- It skips blocks that are hidden, that sit inside a list, or whose class or id looks like page furniture (sidebar, footer, comments, ads, …) without also looking like content (article, main, body, …).
- Each remaining block over 140 characters adds the square root of its extra length to a running score. The page qualifies as soon as the score passes 20. That means a few substantial paragraphs, not a lot of short snippets.

## Applying on page load

When a site's style has Readability turned on, the reader is applied as the page loads:

1. The URL check runs first, so ruled-out pages never show the loading screen.
2. The reader waits for the DOM to be ready. Sites known to load article images lazily wait for the full page load instead, for up to 5 seconds.
3. The post-load and content checks run, then the article is extracted. If the content check or extraction fails, it tries again after 300, 600 and 1,200 ms, so client-rendered pages have time to fill in, before giving up.

Each site also remembers what it has learned, in the page's own local storage:

- **A URL that failed every retry** isn't tried again automatically.
- **A URL shape that has produced a reader view** shows the loading screen straight away next time. The shape is the path without its last segment, with numbers treated as wildcards, so `/2026/09/14/health/some-headline` and `/2027/01/02/health/other-headline` count as the same shape.
- **An unfamiliar shape** is still tried, but without the loading screen, so a page that turns out not to be an article never flashes it.

Turning Readability on from the editor or its keyboard shortcut skips what's been learned and always tries.
