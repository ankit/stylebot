# CSS

How edits land in the user's CSS, and how that CSS is prepared and injected into the page.

## Grouped selectors

When a selector is only styled as part of a grouped rule (`.foo, .bar { … }`),
an edit first moves it into its own rule, carrying over the
declarations it already had, so an edit doesn't silently affect its groupmates.

## Native CSS nesting

postcss parses a nested rule (`.card { .title { … } & + & { … } }`) as a
rule inside a rule, and prints it back verbatim, so nesting survives
every transform untouched. Stylebot treats nested rules as opaque:

- Lookups by selector skip them — `.title` inside `.card` means `.card .title`,
  so a top-level `.title` edit must never land on it.
- Adding a declaration, and reading values for Basic mode, only
  touch a rule's own declarations, and a rule left with nothing but nested
  blocks is kept.
- Marking declarations `!important` reaches into nested rules and into grouping
  at-rules (`@media`, `@supports`, `@container`, `@layer`, `@scope`, …) at any
  depth; only descriptor at-rules such as `@font-face` and `@keyframes`, where
  `!important` is invalid, are left alone.

## Shadow DOM

A stylesheet on the page never applies inside a shadow tree, so on sites built
from web components custom CSS would reach nothing. Stylebot hands the same
prepared CSS to every open shadow root as well: the roots present when a style
is injected, roots attached later, roots belonging to markup whose component is
only defined after the page has parsed, and roots nested inside other roots.
The copies stay in step with the original, so an edit or a toggle reaches them
all at once. Closed shadow roots are invisible to an extension and can't be
reached; Stylebot's own editor and reader are shadow roots too, and are left
out so page CSS can't bleed into them.

Because every root gets the same CSS, a selector for an element inside a shadow
tree is written relative to that tree, and matches the same element in every
instance of that component.

## Where `!important` comes from

Styles are stored exactly as the user wrote them. The CSS that reaches the
page is prepared from them separately: parsed once, its `@import`s stripped
and its declarations marked important in the same pass. That happens for
every style unless the user turned off Use !important for it, and CSS
fetched through an `@import` is never forced.

The background prepares every style when it's saved and keeps the result
alongside the styles, so a page only injects it and never parses CSS itself;
the cache used at page load holds the same prepared CSS. The editor prepares
CSS the same way as you type, so what you preview is what later loads.

## Web fonts on pages with a strict CSP

An `@import` is fetched by the background, so a page's Content Security
Policy never blocks it. The font files that CSS points to are another matter:
Firefox loads them under the page's policy, and a page with `default-src
'self'` and no `font-src` (Hacker News, for one) blocks every Google Fonts
file. Chrome and Edge exempt fonts in extension-injected CSS.

When the page reports a blocked Google Fonts file, the background fetches it
and the page registers the font from its bytes, which makes no request for
the policy to block. Only files the page actually blocked are handled, so it
still loads just the character subsets it renders, and pages without such a
policy never take this path.

That round trip lands after the first paint, so the page would show its
fallback font and then swap on every load. The page keeps each blocked file's
bytes alongside its cached CSS instead, and on later loads registers the font
from them as the style is applied, before the browser first paints. A file no
current `@import` loads is dropped from the cache.
