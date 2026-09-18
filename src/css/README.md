# `css`

This package includes CSS utility methods. Aliased as `@stylebot/css`.

- **`declaration`**: Methods to add css declaration to css

- **`filters`**: Methods to apply CSS Filters to page. Used for applying grayscale to page.

- **`inject-style`**: Methods to insert `<style>` elements with custom css for page.

- **`selector`**: Generates a CSS selector for a picked element
  (`getSelector`), in order:
  - the element's own class, if it's not build-tool-generated (just the
    first one, if it has several) — e.g. skips a CSS-Modules-style
    `WwrzSb` in favor of a real class further down the list
  - failing that, a `data-testid`/`data-test-id`/`data-test`/`data-cy`/
    `data-qa` attribute, then `name` — both deliberate stability hooks
  - the nearest ancestor with any of the above, up to 2 levels up (e.g.
    `.card span` rather than `div span`) — it stops climbing as soon as
    it finds one, rather than always reaching 2 levels
  - failing that, the element's `#id` — ranks above a hashed class (far
    more reliable than a random hash) but below anything genuinely
    authored, its own or an ancestor's
  - failing that, the element's class anyway, hashed or not — still far
    more specific than a generic tag chain
  - failing that, the nearest ancestor's class, hashed or not, the same
    2-level climb as above
  - failing that, a bare tag-name chain — the true last resort

- **`webfont`**: Methods to add/remove web fonts from css
