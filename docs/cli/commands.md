# CLI commands

`stylebot --help` lists every command, and `stylebot <command> --help` describes one.

## Naming the target

Commands that only read default to the active tab, or take `--tab` when their arguments are selectors. Commands that change a style, take a screenshot, move the pointer or force a state (`css set`, `css rule`, `css add`, `profile`, `screenshot`, `hover`, `inspect`, `force`) need the site or tab named, because an agent runs its commands over several steps and the active tab can change in between.

- A **tab** is a tab id, from `tabs` or `open`.
- A **target** is a tab id or a site, such as `news.ycombinator.com`.
- A **profile** is named by its name or id.

## Several browsers

Each browser running Stylebot with the setting on connects on its own, and so does each profile of one browser. With one connected, commands go to it. With more, every command takes `--browser` to say which, since each keeps its own styles and tabs:

```bash
yarn stylebot browsers
yarn stylebot open news.ycombinator.com --browser edge
```

- `browsers` lists them, each with the page it shows, to tell them apart. A browser goes by its name, such as `chrome` or `edge`, or by its name and a short id, such as `chrome-k3f9`, when two of its profiles are connected.
- A command run on a terminal without `--browser` asks which browser to use. Run elsewhere, such as by an agent, it fails, listing the browsers to choose from. The `/stylebot` skill then asks you which one, and names it in every command after.

## Pages

```bash
stylebot open news.ycombinator.com
stylebot outline 54432929
stylebot screenshot 54432929 -o page.png
stylebot screenshot 54432929 --selector '.titleline > a' -o link.png
stylebot screenshot 54432929 --clip 0,0,600,400 --scale 2 -o corner.png
stylebot screenshot 54432929 --state hover --on '.athing' --selector '.athing' -o row.png
stylebot done
```

- `open` shows the page in the CLI's own window, which opens behind yours without taking focus, so an agent never switches your tabs. It reuses that window's tab for the page (any page on the site, for a bare site); `--new` always opens another.
- `tabs` lists open tabs, starring the one each window shows.
- `outline` prints the page's visible elements as an indented outline.
- `screenshot` saves a PNG of a tab's viewport. A hidden tab is shown for a moment to capture it, then the window switches back. It prints the file, the image's size and its scale.
  - `--selector` keeps only the first visible element a selector matches, with a few pixels around it. One out of view is scrolled to for the capture, and the page scrolled back after. One bigger than the viewport is cut to the part that fits, and the output says so. Checking one element this way is quicker and smaller than a whole page.
  - `--clip x,y,w,h` keeps a region, in CSS pixels of the viewport. It can't be combined with `--selector`.
  - `--scale` sets image pixels per CSS pixel. The default, 1, makes a point in a full screenshot the CSS pixel `hover` and `inspect` take; 2 keeps a 2× screen's full resolution.
  - `--state <state> --on '<selector>'` forces a state on the selector's first visible match for this capture only, as [`force`](forced-states.md) does, then takes it off again, unless it was already forced.
- `done` closes the CLI's window.

## Inspecting a page

```bash
stylebot suggestions 54432929
stylebot css-variables 54432929
stylebot page-rules '.titleline > a' --tab 54432929
stylebot computed-styles body color font-size --tab 54432929
stylebot match-count '.titleline > a' '.subline' --tab 54432929
```

These read the page so an agent can look at a page before styling it without another browser tool.

- `suggestions` prints styling requests for the page: up to two that suit it, and a creative look.
- `css-variables` prints the page's css variables, as the `:root` and `body` rules that set them, so a style can override them.
- `page-rules` prints the page's own rules for the elements a selector matches (the first five). Cross-origin stylesheets can't be read, so they're only counted.
- `computed-styles` prints computed values on the first element a selector matches: the properties named, or common layout, color and type ones.
- `match-count` prints how many elements each selector matches, and `invalid` for one that doesn't parse.

## Pointer

```bash
stylebot hover 54432929 '#nav .menu'
stylebot inspect 54432929 120,340
```

These point at the page, so an agent can open what only shows on hover, and find the selector for an element it sees in a screenshot. Neither clicks anything or draws on the page, so screenshots stay clean. Each needs the tab named.

- `hover` moves the pointer onto an element, or a point given as `x,y` in CSS pixels of the viewport, as read off a full `screenshot` at the default scale. A selector aims at the middle of its first visible match, scrolled into view.
- `inspect` prints the selector Stylebot's inspector would pick for an element or point, preferring one the site's style already has rules for. Below it come the other selectors the editor's selector menu would offer for the element, each with how many elements it matches, so an agent can pick a narrower or broader one. It sends the page no events and doesn't open the editor.

Hover's events are synthetic: the page's own handlers run, but CSS `:hover` doesn't apply, and a site that checks for a real user can ignore them. To see hover styles, [force the state](forced-states.md).

## Output

Every command takes `--json` to print the raw response instead of text.
