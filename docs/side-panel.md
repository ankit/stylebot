# Side panel

On Chrome and Edge, the editor can dock in the browser's side panel instead of the page.
It's the same app as the editor in its own window, talking to the page through the
remote bridge (see [Editor](editor.md)). It's a position the user picks, not the default,
and Firefox and Safari don't offer it.

## Opening it

Chrome only opens a side panel during a user gesture: a click, a keypress, a context
menu item, a shortcut. Anything awaited first ends the gesture, so every way in opens the
panel straight away:

- While the side panel is the position, every tab has its panel set up ahead of time, so
  the toggle shortcut can open it without reading anything first.
- The popup opens it straight from its click.
- The page's own shortcuts and buttons ask the background, and the request carries the
  page's gesture with it. A page keeps that gesture for a few seconds, so a request sent
  shortly after the click still counts.

Where the open fails anyway, the editor opens in the page.

## The permission

The side panel needs the `sidePanel` permission, which is optional rather than required.
Vivaldi opens the side panel of any extension holding it on every install and update,
and every user would have seen that, side panel or not. It has no install warning, so
asking for it shows no prompt.

Chrome crashes if an extension uses the side panel after getting the permission while
running, before it reloads ([crbug.com/426412557](https://issues.chromium.org/issues/426412557)).
So a grant always goes with a reload, and nothing touches the side panel between the two.
Each part of the extension remembers whether the permission came while it was running,
and treats the side panel as unavailable until the reload.

The permission is asked for in two places:

- **Picking the side panel in Options.** Stylebot asks during that click, reloads, and
  shows Options again. The editor then opens in the side panel from the first time.
- **Opening the editor in the side panel without it**, as when the position came from
  elsewhere. Stylebot asks, reloads, and opens the editor again where it was. The reload
  ends the gesture, so this once the editor opens in the page, unless the click was in
  the page itself and its gesture is still live.

If the permission is refused, the editor opens in the page. Stylebot never reloads twice
in a row for it.

Users of releases where the permission was required keep it.

## Browsers that won't show it

Some Chromium browsers have the side panel API but don't honour it:

- **Vivaldi** hosts extension side panels as tabs, one shared by every tab, and opens
  them on install and update.
- **Arc** loads side panels but never shows them.

Stylebot doesn't offer the side panel there, and gives up the permission once it knows
it's in one, so Vivaldi stops opening the panel on updates. Vivaldi is found from the
background, by data it adds to its windows. Arc can only be found from a page, by the
palette it adds to every page a moment after it loads.

So before any page has found Arc, the editor can still open in a panel Arc never shows.
After opening a side panel, the background waits a moment for the panel to find out it
isn't showing. If it does, the position moves to the page, and the editor opens there.

The manifest's default side panel is a page that closes itself, and it's switched off
everywhere else. Vivaldi shows it on the first update from a release that required the
permission, before Stylebot has given the permission up.

## Testing

The e2e suite's extension holds the permission, as users of earlier releases do. The
side panel spec also covers a fresh install getting it, from the popup and from Options.
See [e2e](e2e.md).
