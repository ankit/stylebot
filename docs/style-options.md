# Style options

A style can declare options in its CSS, and Stylebot shows a control for each one in the popup. The style's CSS decides what each choice means. Stylebot only records the choice and tells the page.

Options use UserCSS's `@var` syntax, the one Stylus and userstyles.world use, so a userstyle's declarations work as they are. `scheme`, a light/dark switch, is Stylebot's own: it lets one style carry both variants of a theme, rather than two profiles that copy most of the same CSS.

This page is the summary; the code comments carry the detail.

## Declaring options

A style declares its options in a metadata comment, normally at the top, marked either `==Stylebot==` or UserCSS's `==UserStyle==`:

```css
/* ==UserStyle==
@var select scheme "Mode" ["system:System*", "light:Light", "dark:Dark"]
@var select accentColor "Accent" ["rosewater:Rosewater", "mauve:Mauve*", "blue:Blue"]
@var select background "Background" {"near_black:Near black": "#222", "near_white:Near white*": "#ddd"}
@var checkbox rounded "Rounded corners" 1
==/UserStyle== */
```

- **`@var <type> <name> <label> <default>`**, as UserCSS has it. The name is letters, digits, `_` and `-`; the label needs quotes when it has spaces, and the popup shows it as written.
- **`select`** lists its values as an array of `"value:Label"` entries (or just `"value"`, which is its own label), or an object of `"value:Label": "css"` pairs when what the page gets differs from the value. A `*` after an entry makes it the default; without one, the first is.
- **`checkbox`** defaults to `0` or `1`.
- **`scheme`** is reserved for the light/dark switch. It must be a select of exactly `system`, `light` and `dark`, in any order. Its label is ignored: the popup names it Mode, translated, so it reads the same on every site.
- **`@option scheme select [system, light, dark] <default>`** is the older syntax for the same switch, from before `@var`, and still works. If a style declares `scheme` both ways, the first wins.
- The block can go anywhere in the CSS, and either marker works. A JSDoc-style comment works too, with the leading `*`s. A select's values can run over several lines.

UserCSS's other types (`text`, `color`, `number`, `range`, `image`) aren't supported yet. Anything Stylebot can't use is skipped with a warning in the page's console: an unsupported type, a select whose values aren't a JSON array or object, a repeated value, a checkbox default other than `0` or `1`, a second declaration of the same name, or a line that isn't an `@` key. A skipped line never stops the style from applying, it only means no control for it.

Keys other than `@option` and `@var`, such as `@name`, `@author` or `@preprocessor`, are skipped without a warning. They're left for later versions and other tools, so adding one never troubles an older Stylebot. Stylebot doesn't run preprocessors or read `@-moz-document`: a style still applies to the sites it's saved for.

## Describing a style

`@modes light, dark` says a style works in both light and dark without Stylebot's switch, because it follows the site's own theme setting (a `.dark` class, claude.ai's `data-mode`) or `prefers-color-scheme`:

```css
/* ==Stylebot==
@modes light, dark
==/Stylebot== */
```

Stylebot doesn't act on it. The gallery (gallery.stylebot.dev) reads it to badge the style as "Light and dark", since a style that follows the site's theme can't be told apart from its CSS. A style that declares `scheme` doesn't need it: the gallery already treats that as light and dark.

## What the page gets

While a style declaring options is applied, Stylebot gives the page each option's choice two ways:

- **As an attribute** on `<html>`, `data-stylebot-<name>` with the name lowercased: the chosen value, such as `mauve`, or `0`/`1` for a checkbox.
- **As a variable**, `--<name>` on `:root`, as Stylus does: a select's CSS from the object form, else its value.

```css
h1 {
  color: var(--background);
}
:root[data-stylebot-accentcolor='mauve'] a {
  color: #cba6f7;
}
:root[data-stylebot-rounded='1'] .card {
  border-radius: 8px;
}
```

For `scheme`, the attribute is `data-stylebot-scheme`: `system`, `light` or `dark`. The style typically declares its colours with `light-dark()` and pins `color-scheme` for an explicit choice:

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
- **Choices arrive with the CSS.** They're part of the cached state a page applies before its first paint, so a reload never flashes the wrong variant.
- **They follow the page's own style:** the most specific matching style that isn't global. A broader style, such as one for `*.example.com`, can declare options too, but only on pages where it's the most specific match.
- **They go away** when the style is turned off, or when the applied profile no longer declares them. Styles without a block never get any.

## Choosing

When the applied profile declares options, the popup shows a row for each beneath that profile, in one block with it, so they read as the profile's own settings rather than Stylebot's: [System | Light | Dark] for `scheme`, a dropdown for a select and a switch for a checkbox, under the author's labels. A choice applies to every open tab of the site at once, as switching profiles does. The CLI lists and sets them too, with `stylebot options` and `stylebot option set`.

- **Each profile keeps its own choice.** Switching to another profile shows that profile's choice, or its declared default if none was made.
- **No stored choice means the declared default**, so a style's author can change the default and everyone who hasn't chosen follows it.
- **A choice that's no longer allowed**, because the CSS changed its values, falls back to the default.

## Storage and sync

Choices sit on the style, by profile, next to the applied profile (see [Style storage](style-storage.md)):

```json
{
  "activeProfile": "default",
  "profileOptions": { "default": { "scheme": "dark", "accentColor": "blue" } }
}
```

A choice is this device's, like which profile is applied:

- **It isn't an edit.** Choosing doesn't change the style's modified time, add a version to history, or start a sync.
- **Sync keeps each device's own.** A merge keeps this device's choices; a style new to this device brings the other device's along.
- **Deleting a profile deletes its choice.**
