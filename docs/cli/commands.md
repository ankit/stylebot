# CLI commands

`stylebot --help` lists every command, and `stylebot <command> --help` explains one. Every command takes `--json` for raw output.

| Group         | Commands                                                                       |
| ------------- | ------------------------------------------------------------------------------ |
| Pages         | `open`, `tabs`, `outline`, `screenshot`, `done`                                |
| Inspect       | `suggestions`, `css-variables`, `page-rules`, `computed-styles`, `match-count` |
| Pointer       | `hover`, `inspect`, [`force`](forced-states.md)                                |
| Styles        | `styles`, `css get` / `set` / `rule` / `add` / `diff` ([more](styles.md))      |
| Profiles      | `profiles`, `profile create` / `use` / `rename` / `delete`                     |
| Style options | `options`, `option set`                                                        |
| CLI mode      | `mode`, `watch`, `selection`, `say` ([more](cli-mode.md))                      |
| Setup         | `browsers`, `install`                                                          |

## Naming the tab or site

- A **tab** is a tab id, from `tabs` or `open`.
- A **target** is a tab id or a site, such as `news.ycombinator.com`.

Commands that only read use the active tab unless told otherwise. Commands that change something (save CSS, take a screenshot, move the pointer, force a state) always need the tab or site named. An agent works over many steps, and the active tab can change in between.

## Pages

```bash
stylebot open news.ycombinator.com      # prints the tab id, e.g. 54432929
stylebot outline 54432929
stylebot screenshot 54432929 -o page.png
stylebot done
```

- `open` loads the page in a window of the CLI's own, behind yours, so it never takes over your tabs. Add `--new` for another tab.
- `outline` prints the page's visible elements as an indented tree.
- `done` closes the CLI's window.

`screenshot` captures the visible part of the tab. It can also capture just part of it:

| Flag                           | Captures                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `--selector '.titleline > a'`  | The first visible match, scrolled into view if needed                           |
| `--clip 0,0,600,400`           | A region, in CSS pixels                                                         |
| `--scale 2`                    | At 2 image pixels per CSS pixel (the default, 1, matches `hover` and `inspect`) |
| `--state hover --on '.athing'` | With a state [forced](forced-states.md) on an element, for this shot only       |

## Inspecting a page

These let an agent study a page before styling it, without another browser tool.

| Command                                    | Prints                                                      |
| ------------------------------------------ | ----------------------------------------------------------- |
| `suggestions`                              | Two styling ideas that suit the page, and one creative look |
| `css-variables`                            | The page's CSS variables, ready to override                 |
| `page-rules '<selector>'`                  | The page's own CSS rules for the matching elements          |
| `computed-styles '<selector>' [property…]` | Computed values on the first match                          |
| `match-count '<selector>'…`                | How many elements each selector matches                     |

## Pointer

```bash
stylebot hover 54432929 '#nav .menu'
stylebot inspect 54432929 120,340
```

- `hover` moves the pointer onto an element or an `x,y` point read off a screenshot, to open menus that only show on hover.
- `inspect` prints the selector Stylebot would pick for an element or point, plus broader and narrower options with their match counts.

Neither clicks or draws on the page. Hover only fires the page's own handlers; CSS `:hover` styles don't apply. To see those, [force the state](forced-states.md).

## Several browsers

Each browser, and each profile in it, connects on its own. When more than one is connected, pick one with `--browser`:

```bash
stylebot browsers
stylebot open news.ycombinator.com --browser edge
```

`browsers` lists them with the page each is showing. In a terminal, a command without `--browser` asks which one to use. An agent instead gets the list and asks you.
