# `readability`

This package includes code for the stylebot reader. Built using [Defuddle](https://github.com/kepano/defuddle) for article extraction.

Aliased as `@stylebot/readability`

- **`eligibility`**: whether the reader should run on the current page (URL rules, MediaWiki detection, content-density scoring)

- **`lifecycle`**: turning the live page into the reader and back — applying/removing, mounting the Vue app into a shadow DOM, parsing the article, and caching/restoring the original document

- **`loading-screen`**: the themed loading screen shown while the reader is being applied

- **`utils`**: dock UI → background message bridge (closing the reader, sending settings, opening pages)

- **`components`**: Vue components for rendering the stylebot reader

- **`scss`**: CSS for stylebot reader
