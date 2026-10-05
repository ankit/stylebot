# Selectors and CSS

How Stylebot picks selectors for elements and transforms the user's CSS before it reaches the page.

## How selectors are generated

When the user picks an element with the inspector, Stylebot generates a selector for it.
The goal is a selector that is **stable** (survives page rebuilds) and
**meaningful** (reads like something the site author wrote), while still being
specific enough to be useful.

### Priority order

Each strategy is tried in turn; the first one that returns something wins.

1. **Own non-hashed class** — `tag.class`, using the first class that doesn't
   look build-tool-generated. A hashed class earlier in the list is skipped in
   favour of a real one further down (e.g. `.WwrzSb.card` → `div.card`).
2. **Own test id** — `tag[data-testid="…"]`, checking `data-testid`,
   `data-test-id`, `data-test`, `data-cy`, `data-qa` in that order.
3. **Own `name`** — `tag[name="…"]`. Like a test id, it's an identifier, not a
   human-readable description (unlike `aria-label`).
4. **Authored part of its own partly hashed class** — CSS Modules,
   styled-components and similar tools join the author's name with a build
   hash (`Header_nav__a1B2c`, `prc-Link-Link-85e08`, `Nav-sc-1x2y3z-0`). Matching just the authored
   part, `nav[class*="Header_nav__"]`, survives the site's next build and has
   the same specificity as a class. It's used only while it matches exactly the
   same elements on the page as the full class does.
5. **Nearest ancestor with any of the above**, up to 2 levels up, joined with
   the intervening tag chain — e.g. `.card span` or `div.mw-heading h2`. The
   climb stops at the first usable ancestor rather than always reaching 2
   levels.
6. **Own `#id`** — ranks below anything genuinely authored (its own or an
   ancestor's) since ids are often generated, but above a hashed class since
   it's still far more reliable than a random hash.
7. **Own class, hashed or not** — the first class, whatever it looks like.
   Still much more specific than a bare tag chain.
8. **Nearest ancestor's class, hashed or not** — the same 2-level climb as
   step 5, but accepting a hashed class.
9. **Bare tag chain** — `parent-parent parent tag`, up to 2 levels. The true
   last resort.

### What counts as a "hashed" class

A class name counts as hashed, carrying no stable meaning, when it has:

- a known library prefix: `css-`, `sc-`, `jsx-`, `emotion-`, `styled-`,
  `chakra-`
- a hex-like hash such as CSS Modules' `_1a2b3c`
- a short (4–12 chars) name with an unusually high number of case transitions,
  which separates a hash like `WwrzSb` from a camelCase word like `navBar`

Otherwise, anything containing `-` or `_` is treated as authored, unless it's
partly hashed:

- a `__`-separated segment that reads like a hash rather than a word: letters
  mixed with digits (`a1B2c`, but not `item2`) or frequent case changes. The
  parts on either side are kept, so Turbopack's `page-module__E0kJGG__main`
  becomes `[class*="page-module__"][class*="__main"]`.
- styled-components' `Name-sc-hash-0`, which keeps `Name-sc-`.
- a dash-separated CSS Modules name ending in a 5-character hash, like
  Primer's `prc-TopicTag-TopicTag-LS-jX`, which keeps `prc-TopicTag-TopicTag-`.
  It needs a PascalCase component name before the hash, and a hash that mixes
  letters with digits or case, so utility classes like `col-md-12` stay
  authored.

### Other selectors for the element

The selector field also offers the other strategies' selectors for the picked
element, narrowest first, keeping one per set of matched elements, each
with how many elements it matches. The list always starts with:

- **Only this element** — its `#id` when that's unique, otherwise the
  element and its ancestors, each positioned with `:nth-of-type` where a
  sibling would also match, climbing until only this element matches or an
  ancestor has a unique `#id`. Positions shift when a list reorders, so this
  is the least stable choice.
- **This item** — elements like it inside the nearest repeated ancestor (a
  row, list item or card), e.g. `tr.athing:nth-of-type(3) a` for every link
  in one row.

### Reusing existing rules

Before generating a fresh selector, the inspector checks whether the user's
CSS already has a selector that matches this element — via the browser's own `el.matches()`, not string
comparison. That way picking an element already targeted by a hand-written
selector (a descendant combinator, `:nth-child`, one member of a grouped
selector, …) continues editing that rule instead of starting a second,
disconnected one. Interaction pseudo-classes like `:hover` and `:focus` are
excluded, since matching one of those only means the cursor happens to be on
the element right now.

Only selectors that target the element itself are reused: the subject (the
rightmost compound) must carry a class, id, attribute or structural
pseudo-class (`:nth-child`, `:first-of-type`, …). A broad selector like `*`,
`a` or `.card p` would otherwise capture every element it matches and keep the
user from styling the one they picked. A tag-only selector is still reused when
it's exactly what would be generated for the element anyway (e.g.
`div.mw-heading h2`).

### Grouped selectors

When a selector is only styled as part of a grouped rule (`.foo, .bar { … }`),
an edit first moves it into its own rule, carrying over the
declarations it already had, so an edit doesn't silently affect its groupmates.

### Native CSS nesting

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
