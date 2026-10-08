---
name: stylebot
description: Restyle websites in the user's browser with the Stylebot extension's `stylebot` CLI — dark modes, themes, fonts, bigger text, hiding clutter, fixing a layout, or editing and managing the CSS and profiles Stylebot has saved for a site. Use when the user wants to change how a website looks, or asks about their Stylebot styles.
argument-hint: [site] [what to change]
allowed-tools: Bash(stylebot *) Read(~/.stylebot/work/**) Edit(~/.stylebot/work/**)
---

# Restyling websites with Stylebot

Stylebot is a browser extension that saves custom CSS per site and applies it every time the site loads. The `stylebot` command drives it in the user's running browser: it opens and reads pages, saves CSS that applies live, checks the page after each save, and takes screenshots. `stylebot --help` lists every command, and `stylebot <command> --help` describes one.

Read and check pages only through `stylebot`, never another browser tool (browser automation, a screenshot tool, fetching the url). The page Stylebot styles can be in a different browser or profile from the one those tools see, so what they report won't reflect the CSS you saved.

## Running commands

- Run one `stylebot` command per Bash call, exactly as written here: no `cd`, `&&`, `;`, pipes, `$(...)`, `<` or heredocs. Those need the user's approval each time; a plain `stylebot` command doesn't.
- Keep every file in `~/.stylebot/work/`: CSS as `~/.stylebot/work/<site>.css`, screenshots as `~/.stylebot/work/<site>-1.png`, `-2.png` and so on. You can read and write there without asking. Write files with your file-writing tool, never the shell.

## Setup

The first command sets the CLI up with the user's browsers on its own. When a command can't reach Stylebot, or says the CLI and Stylebot don't match, its message names the one thing to do, such as turning on the setting, opening or restarting the browser, or updating Stylebot or the CLI. Tell the user the message as it is, and try again once they say it's done.

To see everything that's left, run `stylebot install`: it prints a checklist. Tell the user each step not yet done (marked ○) as written.

If `stylebot` isn't found, the CLI isn't installed: tell the user to install it with `npm install -g @stylebot/cli`, as https://stylebot.dev/cli describes.

## Workflow

1. **Open the page**: `stylebot open <site or url>` shows it in Stylebot's own window, behind the user's, without taking focus. It prints `Opened <tab> <url>` (or `Found` when it reuses a tab). Pass that tab id to every command that reads the page (`stylebot outline <tab>`, `--tab <tab>` for commands that take selectors, `stylebot screenshot <tab>`), and the site to the commands that change a style (`stylebot css set <site>`). Never rely on the active tab: the user can switch tabs while you work, and commands that change a style refuse to guess.
2. **If the user hasn't said what to change**, or asks for ideas, run `stylebot suggestions <tab>`: the requests Stylebot's own Chat offers for this page, chosen from what's on it, plus a creative look. Offer their names as choices, with your tool for asking the user a question if you have one, and an option for something else. Carry out the chosen suggestion's full request text.
3. **Start a profile**: run `stylebot profiles <site>` to see which profile is in use (starred), then `stylebot profile create "Claude: <look>" <site> --from <profile in use> --use`, naming the look in a word or two ("Claude: Dark", "Claude: Compact"). Your changes go there, and the user's own style stays one `stylebot profile use <profile> <site>` away. If the profile already exists from an earlier session, reuse it with `stylebot profile use`.
4. **Read the page**: `stylebot outline <tab>` prints its visible elements and how each looks. `stylebot css-variables <tab>` prints its CSS variables. `stylebot css get <site>` prints the CSS already saved; build on it rather than starting over unless the user asks for a fresh start.
   - To style something that only shows on hover (a menu, a tooltip), open it first with `stylebot hover <tab> <selector>`, then read the outline again. A point works in place of a selector, as `x,y` in the pixels of a screenshot of the tab. Hovering doesn't apply the page's CSS `:hover`, so check hover styles by reading the CSS, not a screenshot.
   - When the user points at something you can't find in the outline, `stylebot inspect <tab> <x,y>` prints the selector Stylebot's inspector would pick for the element at that point of a screenshot, then other selectors for it with how many elements each matches: choose the one whose reach fits what the user asked to change.
5. **Write the CSS** to `~/.stylebot/work/<site>.css`, then save it with `stylebot css set <site> --file ~/.stylebot/work/<site>.css`. It replaces the site's whole stylesheet and applies to open tabs right away, so the file always holds the complete stylesheet: what was there and should stay, plus your changes. It refuses CSS that doesn't parse, and imports any Google Fonts family you name.
6. **Fix what `css set` reports**: it checks the page the way Stylebot's Chat does, listing how many elements each selector matched, text your CSS made hard to read, surfaces a theme change missed, and selectors built on class names the site generates. Edit the file and save again until the report is clean:
   - Fix the cause, not the symptom. When only some of a selector's elements are hard to read, or one of your selectors painted a background, that selector is probably too broad (`tr:first-child td` matches the first row of every table): narrow it or take it back rather than recoloring text everywhere.
   - When one of your variables set the text's color, change that variable once instead of recoloring each element that uses it.
   - Replace a selector that matched nothing with one from the outline, unless it's meant for another page of the site. One that matched hundreds of elements is probably too broad.
   - When `css set` reports selectors it saved by the stable part of a class name, keep them that way. Replace a fragile selector left in the report, built on a class name with no stable part, with one that selects by something else.
7. **Look at it**: `stylebot screenshot <tab> -o ~/.stylebot/work/<site>-<n>.png`, then open the image and look at it; never report a change you haven't seen. Run `stylebot outline <tab>` again too: it shows the colors and sizes as they are now, so it confirms a selector took effect and catches dark text on a dark background. Fix what's off and repeat.
8. **Close up**: run `stylebot done` to close Stylebot's window.
9. **Tell the user** in a sentence or two what changed, that it's saved in the "Claude: <look>" profile, and that `stylebot profile use <their profile> <site>` (or the profile menu in Stylebot) switches back. Don't paste the CSS unless they ask.

Empty CSS deletes the site's style. Confirm with the user before deleting a style or a profile they made themselves.

## Reading the outline

- Each line is an element: tag, id, classes, a `[bgcolor]` attribute when it has one (that's its own background, so no `bg` repeats it; select by it, as in `td[bgcolor="#ff6600"]`, when nothing else picks the element out), a snippet of its own text, then in brackets how it looks where that differs from its parent. `bg` is its own background color, `bg-image` a background image or gradient, `color` its text color, `font` its text size, `family` the font it sets.
- The first of a run of repeated items (rows, cards, list items) also shows how it's spaced: `pad` and `margin` as CSS shorthand, `lh` its line-height as a multiple of its font size, `h` its rendered height; a container of such items shows its flex or grid `gap`. Size spacing changes from these. Making a list compact means `h` should shrink: lower `lh` (toward 1.2), and the `pad`, `margin` and `gap` that are above 0; never add any, and leave what is already 0.
- The first line, `(page)`, is the page's base background, text color, size and font. An element without `bg` shows whatever is behind it.
- Use the brackets to find what a request is about: the elements with a white `bg`, the dark `color` that won't read on a new background, the small `font` that should grow.

## Looking closer

- `stylebot page-rules <selector> --tab <tab>` prints the site's own rules for the elements a selector matches: match or outdo their selectors where specificity matters, and build on the values already there.
- `stylebot computed-styles <selector> [property...] --tab <tab>` prints computed values on the first element a selector matches, for exact sizes, colors and fonts.
- `stylebot match-count <selector...> --tab <tab>` prints how many elements each selector matches, to try a selector before saving it.

Quote selectors in single quotes: `stylebot match-count '.titleline > a' --tab 1234`.

## Writing CSS

- Use selectors that match elements in the outline. Prefer stable ids and classes; avoid generated-looking class names (long random strings) and `:nth-child` chains. Keep selectors as short as they can be while still matching the right elements.
- Never style bare element selectors that sweep the whole page, like `div`, `span`, `section`, `article`, `p` or `*`: a background on `div` paints over every card and panel at once. Name the specific elements instead.
- Stylebot applies every declaration with `!important` unless the user has turned that off for the site, so don't add it yourself.
- For fonts, name any Google Fonts family and `css set` imports it. Set `font-family` to that one family with no fallback stack (`font-family: Lora`, not `font-family: Lora, Georgia, serif`), quoted only if the name has spaces.
- An element with its own `family` in the outline doesn't inherit a font set on `body`. To change the font everywhere, override the page's font variables when it has them, and otherwise set it on `body` and on each element that shows its own `family`; leave code and monospace alone unless asked.

## Changing colors

Always check the page's CSS variables first (`stylebot css-variables <tab>`). Many sites define their palette as custom properties, and overriding a variable recolors everything that uses it consistently, including states and parts not in the outline. Set the variable itself on the selector it's listed under (`:root` or `body`), and only set colors on individual elements when no variable covers what the user asked for, or to fix an element that doesn't follow the variables.

## Restyling a whole page (a dark mode, a new theme)

1. Override the palette variables, if the page has them.
2. Set the base background and text color on `body`, and on `html` when the `(page)` background comes from it.
3. Recolor each element the outline shows with its own `bg` that would clash, with its own selector, and give it a matching `color` if its text would no longer read.
4. Set `color` on the containers that hold text, not on every element. Links, headings and buttons that set their own `color` need theirs too.
5. Remember form fields, borders, and icons drawn with `fill` or `stroke`. Set `color-scheme` on `:root` so scrollbars and native controls follow.

Keep text readable: light text on dark backgrounds or the reverse, never dark on dark, and a contrast of at least 4.5.

When asked to surprise the user, pick one coherent direction, a palette and a font pairing, and say in a sentence what you're going for: the colors, the fonts and the feel.
