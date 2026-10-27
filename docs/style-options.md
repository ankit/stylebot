# Style options

A style can declare options in its CSS, and Stylebot shows a control for each one in the popup. The style's CSS decides what each choice means. Stylebot only records the choice and tells the page.

The one option so far is `scheme`, a light/dark switch. It lets one style carry both variants of a theme, rather than two profiles that copy most of the same CSS.

This page is the summary; the code comments carry the detail.

## Declaring an option

A style declares its options in a metadata comment, normally at the top:

```css
/**
 * ==Stylebot==
 * @option scheme select [system, light, dark] system
 * ==/Stylebot==
 */
```

- `scheme` is the option, `select` its type, the bracketed list its values, and the last word the default.
- `scheme` takes exactly `system`, `light` and `dark`, in any order. The default may be any of them.
- The block can go anywhere in the CSS. A plain comment works too, without the leading `*`s: `/* ==Stylebot==` … `==/Stylebot== */`.
- An option has no label. The popup names it itself, translated, so it reads the same on every site.

Anything Stylebot can't use is skipped with a warning in the page's console: an unknown option, another type, other values, a default that isn't one of the values, a second declaration of the same option, or a line that isn't an `@` key. A skipped line never stops the style from applying, it only means no control for it.

Keys other than `@option`, such as `@name` or `@author`, are skipped without a warning. They're left for later versions and other tools, so adding one never troubles an older Stylebot.

## What the page gets

While a style declaring `scheme` is applied, Stylebot sets the choice on `<html>` as `data-stylebot-scheme`: `system`, `light` or `dark`.

The style uses it, typically by declaring its colours with `light-dark()` and pinning `color-scheme` for an explicit choice:

```css
:root {
  color-scheme: light dark;
  --ink: light-dark(#2b2b33, #dcdbe2);
}
:root[data-stylebot-scheme='light'] {
  color-scheme: light;
}
:root[data-stylebot-scheme='dark'] {
  color-scheme: dark;
}
```

- **System** follows the browser's light/dark preference, which comes from the OS (macOS and Windows appearance, GNOME and KDE's dark preference) unless the browser overrides it for websites, as Firefox's Website appearance setting can.
- **The attribute arrives with the CSS.** It's part of the cached state a page applies before its first paint, so a reload never flashes the wrong variant.
- **It follows the page's own style:** the most specific matching style that isn't global. A broader style, such as one for `*.example.com`, can declare the option too, but only on pages where it's the most specific match.
- **It goes away** when the style is turned off, or when the applied profile doesn't declare the option. Styles without the block never get it.

## Choosing

When the applied profile declares `scheme`, the popup shows a Mode row beneath that profile, in one block with it, so it reads as the profile's own setting rather than Stylebot's: [System | Light | Dark]. A choice applies to every open tab of the site at once, as switching profiles does.

- **Each profile keeps its own choice.** Switching to another profile shows that profile's choice, or its declared default if none was made.
- **No stored choice means the declared default**, so a style's author can change the default and everyone who hasn't chosen follows it.
- **A choice that's no longer allowed**, because the CSS changed its values, falls back to the default.

## Storage and sync

Choices sit on the style, by profile, next to the applied profile (see [Style storage](style-storage.md)):

```json
{
  "activeProfile": "default",
  "profileOptions": { "default": { "scheme": "dark" } }
}
```

A choice is this device's, like which profile is applied:

- **It isn't an edit.** Choosing doesn't change the style's modified time, add a version to history, or start a sync.
- **Sync keeps each device's own.** A merge keeps this device's choices; a style new to this device brings the other device's along.
- **Deleting a profile deletes its choice.**
