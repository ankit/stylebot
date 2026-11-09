# Forced states

`force` makes a page's `:hover`, `:active`, `:focus`, `:focus-visible` or `:focus-within` styles apply without a real pointer or focus. An agent can then check a theme's hover and focus colors on the page instead of guessing from the CSS.

```bash
stylebot force 54432929 '.athing' hover                    # first visible match
stylebot force 54432929 'input[name=q]' focus-visible --all  # every match
stylebot force 54432929                                    # list what's forced
stylebot force 54432929 --clear
```

```text
$ stylebot force 1234 '.athing' hover
Forced hover on .athing (1 element, 6 ancestors).
```

A state stays forced until `--clear`. While it's on, `outline`, `computed-styles`, `page-rules`, `inspect`, `screenshot` and the check after a save all see the page in that state. For a single screenshot, use `screenshot --state hover --on '<selector>'` instead.

## How it works

It's the same trick Storybook's pseudo-states addon uses, so it needs no debugger and no extra permission:

1. Copy every page rule that uses the state, with `:hover` swapped for an attribute of the same specificity.
2. Put that attribute on the element. Hover and active also go on its ancestors, and focus-within on the ancestors of a focused element.
3. Skip transitions to their end, so screenshots show the final state.
4. Copy the rules again whenever the page's stylesheets change.

## Limits

- Only the top frame; iframes keep their real state.
- Rules for when an element _isn't_ in the state, like `.button:not(:hover)`, still apply too.
- A forced rule wins ties with later rules that a real hover would lose. Stylebot's own rules use `!important`, so they still win.
- If the page re-renders an element, it loses its forced state. Run `force` again.
