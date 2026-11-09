# Styles, profiles and options

## Styles

```bash
stylebot css get news.ycombinator.com --grep titleline
stylebot css rule 54432929 '.titleline a' --set color=#e8e6e3
stylebot css add 54432929 --file more.css
stylebot css set 54432929 < hn.css
```

- `styles` lists saved styles.
- `css get` prints a style's css. `--grep <text>` prints only the rules whose selector or declarations contain the text, ignoring case, inside the at-rules they sit in.
- `css set` saves css from stdin or `--file` in place of the whole stylesheet and applies it to open tabs right away. Empty css deletes the style.
- `css rule <target> '<selector>'` edits the first top-level rule with exactly that selector, or with `--media '<query>'` the first inside that top-level `@media`. `--set property=value` sets a declaration and `--unset property` removes one, each repeatable; `--delete` removes the rule. Setting creates the rule at the end when none matches, and a rule left empty is removed. Everything else in the stylesheet keeps its formatting and comments.
- `css add` adds css from stdin or `--file` to the end of the stylesheet, moving any `@import` to the top, and names the rules it added whose selector already has one, which `css rule` could have edited instead.
- `css diff` shows the rules css from stdin or `--file` would add, change and remove if `css set` saved it, without saving anything.
- `css rule` and `css add` save the way `css set` does, with the same checks and report:

  - It refuses css that doesn't parse, saying at which line, and adds Google Fonts imports for the families the css names. It also saves a selector's partly generated class names by their stable part, and says which it changed.
  - When the profile it saves is the one in use and an open tab shows the site, it checks the page; otherwise it says why it didn't. Given a tab id, it saves the style that applies on that tab and checks that tab. Given a site, it checks the active tab of the CLI's own window if it shows the site, else any tab that does, and names the other tabs showing the site in one line.

    ```text
    $ stylebot css set news.ycombinator.com --file hn.css
    Saved news.ycombinator.com
    Checked on tab 1234.
    Also shown on tab 1240: name a tab id instead of the site to check that tab.
    Elements each added or changed rule matched:
    - .titleline a: 30 elements
    Removed rules:
    - .old-banner
    5 unchanged rules not listed
    Problems the page check found:
    - Hard to read: .subtext (30 elements), text #828282 on #1d1f21, contrast 3.1:1
    ```

  - `css rule` says when it created or removed the rule, and names the properties it was asked to unset that the rule didn't have.

    ```text
    $ stylebot css rule 1234 '.subtext' --set color=#a8a8a8
    Saved news.ycombinator.com
    Checked on tab 1234.
    Elements each added or changed rule matched:
    - .subtext: 30 elements
    5 unchanged rules not listed
    ```

  - `css diff` prints each rule added or removed whole, and for each rule changed only the declarations that differ:

    ```text
    $ stylebot css diff news.ycombinator.com --file hn.css
    --- news.ycombinator.com, as saved
    +++ the css given

      .subtext {
    -   color: #828282;
    +   color: #a8a8a8;
      }

    + .comment (in @media (max-width: 750px)) {
    +   font-size: 15px;
    + }

    Rules: 1 added, 1 changed, 0 removed. Nothing saved.
    ```

## Profiles

```bash
stylebot profile create Dark news.ycombinator.com --use
stylebot css set news.ycombinator.com --profile Dark < dark.css
```

- `profiles` lists a style's profiles, starring the one in use.
- `profile create`, `use`, `rename` and `delete` manage them.
- `css get`, `rule`, `add`, `set` and `diff` take `--profile` to name the profile rather than use the active one. The `/stylebot` skill always passes it, so a profile switch mid-session can't send its css into your own style.

## Style options

```bash
stylebot options news.ycombinator.com
stylebot option set scheme dark news.ycombinator.com
```

- `options` lists the options a profile's css declares (see [Style options](../style-options.md)), each with its type, its label when the author gave one, its value, the values it takes and its default. A checkbox takes `0` and `1`.
- `option set` sets one, applying it to open tabs as the popup does. It refuses an option the profile doesn't declare, or a value it doesn't take.
- Both take `--profile` to name the profile rather than use the active one. The `/stylebot` skill uses `option set` to check a light/dark style in each variant, then sets it back to the user's choice.
