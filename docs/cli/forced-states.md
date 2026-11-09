# Forced states

```bash
stylebot force 54432929 '.athing' hover
stylebot force 54432929 'input[name=q]' focus-visible
stylebot force 54432929
stylebot force 54432929 --clear
```

`force <tab> '<selector>' <state>` makes the page's CSS for a state apply as if a real pointer or focus were there: `hover`, `active`, `focus`, `focus-visible` or `focus-within`. It goes on the selector's first visible match, or every match with `--all`, and stays until `--clear`. While it's forced, `outline`, `computed-styles`, `page-rules`, `inspect`, the page check after a save and `screenshot` all see the page in that state, so an agent can check a theme's hover and focus colors instead of reading them off the CSS. `force <tab>` lists what's forced.

```text
$ stylebot force 1234 '.athing' hover
Forced hover on .athing (1 element, 6 ancestors).
```

It works the way Storybook's pseudo-states addon does, without the browser's debugger, so it needs no extra permission:

- It copies every rule on the page that names one of those states, from the page's stylesheets, its constructed ones and those of open shadow roots, with the state swapped for an attribute of the same specificity, inside the same `@media`, `@supports`, `@layer` and `@container`, `!important` kept. The copies go after the scope's own sheets. A cross-origin stylesheet the page can't read is fetched by the extension, which says when it couldn't fetch one.
- Hover and active go on the element and every ancestor, across shadow boundaries; a focus state goes on the element, with focus-within on its ancestors. Transitions the change starts jump to their end, so a screenshot shows the state rather than part of the fade.
- While anything is forced, it copies the rules again when stylesheets are added or change, including Stylebot's own when a save applies, and before every command reads the page.

Its limits:

- Only the top frame is forced, as the CLI only reads that one; iframes keep their real state.
- A forced state doesn't stop the page's rules for when an element isn't in that state, such as `.button:not(:hover)`, from applying to it too.
- The copies come after every other rule, so where a state rule and a later rule tie on specificity without `!important`, the state rule wins, where with a real pointer the later one would. Stylebot's own rules carry `!important` unless the site turns that off, so they still win.
- An element the page replaces, as a framework re-render can, loses its forced state; `force` again.
