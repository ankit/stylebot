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
4. **Nearest ancestor with any of the above**, up to 2 levels up, joined with
   the intervening tag chain — e.g. `.card span` or `div.mw-heading h2`. The
   climb stops at the first usable ancestor rather than always reaching 2
   levels.
5. **Own `#id`** — ranks below anything genuinely authored (its own or an
   ancestor's) since ids are often generated, but above a hashed class since
   it's still far more reliable than a random hash.
6. **Own class, hashed or not** — the first class, whatever it looks like.
   Still much more specific than a bare tag chain.
7. **Nearest ancestor's class, hashed or not** — the same 2-level climb as
   step 4, but accepting a hashed class.
8. **Bare tag chain** — `parent-parent parent tag`, up to 2 levels. The true
   last resort.

### What counts as a "hashed" class

A class name counts as hashed, carrying no stable meaning, when it has:

- a known library prefix: `css-`, `sc-`, `jsx-`, `emotion-`, `styled-`,
  `chakra-`
- a hex-like hash such as CSS Modules' `_1a2b3c`
- a short (4–12 chars) name with an unusually high number of case transitions,
  which separates a hash like `WwrzSb` from a camelCase word like `navBar`

Anything containing `-` or `_` is treated as authored, whatever its shape.

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
every style unless the user turned off Override site styles for it, and CSS
fetched through an `@import` is never forced.

The background prepares every style when it's saved and keeps the result
alongside the styles, so a page only injects it and never parses CSS itself;
the cache used at page load holds the same prepared CSS. The editor prepares
CSS the same way as you type, so what you preview is what later loads.
