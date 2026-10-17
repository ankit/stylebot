## Version 4.0.5 (October 2026)

- Fix Vivaldi opening the side panel on its own after installing or updating Stylebot
- Show the rating prompt as a quieter card under Edit style in the popup

## Version 4.0.4 (October 2026)

- Make Stylebot usable in Arc (#1212)
- Vivaldi: no longer open the side panel after installing or updating, and hide the Side panel option (#1215)
- Keep the options page's style editor open after saving, save it with Ctrl+S / ⌘S, and only enable Save when there are changes (#1207, #1209)
- Stop syncing every time the popup opens; Stylebot still syncs in the background, and Sync now syncs on demand (#1213)
- Fix "A listener indicated an asynchronous response…" errors showing up in page consoles (#1214)

## Version 4.0.3 (October 2026)

- Open the editor docked in the page on the right by default, instead of in the side panel
- Style images, videos and text files opened in their own tab (#1202)
- Fix the inspector not picking elements while editing in Code
- Fix styles sometimes staying on in open tabs after being turned off
- Fix the toolbar icon warning about sync when Google Drive was unreachable or rate-limited (#1199)
- Keep Drive sign-in working longer on Chrome, Edge and Firefox
- Sync when the popup opens without showing a spinner
- Drop the style count and reader badges from the toolbar icon
- Center the selector in the inspector's card
- Make the browser faster after an update and on pages with many styles (#1200, #1203, #1204)

## Version 4.0.2 (October 2026)

- Remove Chat; to restyle pages with AI, use the `stylebot` command line with a coding agent like Claude Code (#1190)
- Hide the inspect highlight when the pointer leaves the page, and stop inspecting when the editor's Options menu opens
- Fix shortcut labels in the options page's Basics being too bright in dark mode

## Version 4.0.1 (October 2026)

- Make Chat optional: it stays hidden until you turn it on in the options page's Basics, and stays on if you already use it (#1183)
- Redesign the options page's Basics, adding the editor's position and setup for the `stylebot` command line (#1187)
- Open the editor docked in the page in Vivaldi, which can't show it in the side panel (#1185)
- Fix row menus being cut off in the options page's Styles list (#1188)
- Make the extension smaller to download

## Version 4.0.0 (October 2026)

- Redesign the editor, with dark mode, grouped Basic controls that show the page's own values, color palettes and an eyedropper, hover previews for colors and fonts, in-place editing of any other property, and undo/redo (#1109, #1108, #1103, #1101, #1158, #1055, #1124, #916)
- Generate better selectors that keep working when a site updates, with alternatives to choose from (#949, #1102, #1110, #1165, #1168, #1178, #1179)
- Add profiles, to keep several looks for a site and switch between them from the editor, the popup or the options page (#1123, #1125, #1130, #1134)
- Open the editor in Chrome and Edge's side panel, or pop it out into its own window (#993, #994, #996)
- Add Chat: describe a look, or pick a suggested one, and Stylebot writes the CSS, with your own Claude, OpenAI or Gemini key (#1073, #1074, #1075, #1076, #1143, #1174, #1176)
- Add the `stylebot` command line, so coding agents like Claude Code can restyle pages in your browser
- Add version history, to restore any earlier version of a style (#1020)
- Make Google Drive sync more robust: edits from different computers are merged, and sync runs on its own every 30 minutes and after you edit (#975, #976, #977, #1156, #1160)
- Apply styles inside shadow DOM, so they work on sites built with web components
- Redesign the options page's Styles, style editor, Basics and version history pages, and review a backup before importing it (#964, #1135)
- Move Stylebot's shortcuts into the browser's shortcut settings; in Chrome and Edge, shortcuts you changed are back to their defaults (#1117)
- Install styles from the stylebot.dev gallery as new profiles
- Load pages faster by injecting precompiled styles and loading the editor and reader only when needed (#1028, #1041, #1026, #1042)
- Fix Google Fonts on pages with a strict content security policy, and stop web fonts flashing while editing (#1119, #1166, #1167)
- Support native CSS nesting (#1010)
- Add Vietnamese and Indonesian, and revise every other translation
- Update the Stylebot icon and launch a new stylebot.dev (#1045, #1031)

## Version 3.2.4 (September 2026)

- Fix CSS autocomplete and color swatches not working in the code editor (#921)
- Fix Readability being unable to be turned off on non-article pages (#915)
- Fix Readability toggle in the popup not working with multiple windows open (#913)

## Version 3.2.3 (September 2026)

- Fix injected CSS losing !important cascade priority (#896)

## Version 3.2.2 (September 2026)

- Redesign the options page with dark mode support and drop bootstrap-vue (#873)
- Fix unclickable top/bottom edges on the popup's main style toggle (#881)
- Reduce extension size by disabling inline source maps in production builds (#892)

## Version 3.2.1 (September 2026)

- Fix Readability toggle silently setting Magic as the global default mode (#877)

## Version 3.2.0 (September 2026)

- Fix flash of unstyled content on page load and in the CSS editor (#833, #834, #841, #842)
- Overhaul Readability mode: switch the article-extraction engine to Defuddle for better page cleanup, plus a customizable theme and font, an inline settings dock, an animated loading experience, a keyboard shortcut, and localized menus (#854, #857, #855, #866, #870, #852)
- Fix Readability blank page, flashing, and mid-load/hydrating-page toggle bugs (#848, #850)
- Redesign the popup UI with dark mode support, a direct settings button, and fully clickable toggle rows (#867, #876, #845)
- Fix false syntax errors in the CSS editor by upgrading Monaco (#838)
- Fix CSS selector escaping and `@import` handling bugs (#821, #835)
- Wrap long URLs in the styles overview (#837)
- Revise zh-TW translations (#793)

## Version 3.1.4 (May 2024)

- Chrome and Edge Only release
- Migrate extension to use [Manifest v3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- Improve translations (#758, #755, #734)

## Version 3.1.3 (July 2022)

- Skip 3.1.2 to align Firefox and Chrome Version
- Improved Japanese translation (#714)
- Restrict import file type to json (#708)
- Fix bug to correctly adjust page layout when stylebot is first opened on a page
- Fix font picker for readability
- Fix bug with wildcard usage (#700)
- Fix Portuguese locale configs to match locale code supported by extensions

## Version 3.1.1 (July 2022)

- Allow adding custom fonts via Options page (#707)
- Fix issues and improve domain matching logic. Thanks @lionel-rowe (#690)
- Fix style editor in Options page. Thanks @senocular (#669)
- Add Portuguese translation. Thanks @salomaogabriel (#673)
- Translation fixes. Thanks @WofWca @Gitoffthelawn (#697, #683, #679)

## Version 3.1 (May 2021)

- Added ability to resize stylebot editor
- Added support for syncing and backing up styles using Google Drive
- Added ability to reduce page's width when stylebot is opened
- Add color palettes for easier color selection
- Bugfixes (#629, #626, #607, #595)

## Version 3.0.7

- Fix style toggle switch bug in popup (#612)
- Improvements to Japanese translation

## Version 3.0.6

- Add Firefox support
- Improvements to German translation (#604)
- Bugfixes (#596)

## Version 3.0.5

- Enable localization for German, Spanish, French, Italian, Japanese, Korean, Russian, Chinese (China) and Chinese (Taiwan)

## Version 3

- Re-wrote extension from scratch using modern tools ([PostCSS](ttps://postcss.org/), [Vue.js](https://vuejs.org/))
- Modern, cleaner Stylebot Editor UI
- Readability Mode - Make articles on any site readable by hiding
  non-essential page elements like sidebars, footers and ads. Based on [Mozilla Readability](https://github.com/mozilla/readability)
- Improved code editor based on [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Support for all modern CSS syntax and rules
- CSS comments and ordering is retained across edits
- Numerous other bugfixes with the modern implementation

## Version 2.4

- Re-wrote options page for better experience and maintainability
- Code editor in the options page is now [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Replace "Remove styling" in popup with toggle to enable/disable styling. This fixes a long-standing issue where users accidentally permanently deleted the styles applied to the page.
- Remove explicit Global Stylesheet setting in the options page
- Fix Changelog link in the options page

## Version 2.3

- Maintenance update
- Added reasoning for Chrome Permission Requirements
- Deprecate social features in extension until the webapp can be brought back up

## Version 2 (June 26, 2013)

- Watch the [video](http://www.youtube.com/watch?v=zcOLjfPptw4)
- Easy way to discover, preview and install styles from Stylebot Social. Click on the css icon in the address bar
- Easy sharing of styles to Stylebot Social (screenshot is automatically generated)
- Support for regular expressions for URLs. Start a regex with `^`. See [Pattern Matching](https://github.com/ankit/stylebot#pattern-matching) in Stylebot
- Support for @rules (including `@import, @keyframes, @font-face, @media, @page, @variables, @charset and @namespace`)
- Support a custom font stack in Basic Mode. The font stack shows your most recently used fonts
- Support for Google Web Fonts. Enter a Google Web Font name in Basic Mode and it is automatically added to the CSS. Try entering Lato.
  You will have to live with console warnings of the form: `The page at **\_\_\_** displayed insecure content from http://themes.googleusercontent.com/static/fonts/**\_**`
- Design improvements to Stylebot Social
- Fixed issue where CSS may not be applied when tabs were first restored on browser start
- The CSS icon is now more prominent
- Fixed issues with the CSS icon not working/appearing at times. It now works on Gmail
- Removed the confusing "Enable Styling" option from the right click menu
- Undo support for Reset and Reset Page Buttons
- Fixed issue where global CSS was visible on raw XML pages

## Version 1.5

- Added support for wildcards `**` and `*` in URL. Examples:

  - `docs*.google.com`: This will match `http://docs.google.com`, `http://docs1.google.com`, `http://docs2.google.com` and so on
  - `*.ycombinator.com`: This will match `http://news.ycombinator.com`, `http://apps.ycombinator.com`, etc.
  - `docs.google.com, spreadsheets.google.com`: This will match any URL that contains `docs.google.com` or `spreadsheets.google.com`
  - For details, refer the [Pattern Matching](https://github.com/ankit/stylebot#pattern-matching)

- Stylebot Panel Appearance and Layout Tweaks
- Added support for `@-webkit-keyframes`
- Styles are not injected into `xml/json/pdf` content to prevent DOM pollution
- Improved Styles list in Options
- Bugfixes

## Version 1.4

- Replaced textarea with [Ace Code Editor](http://ace.ajax.org/) in Stylebot Panel
- Added ability to enable or disable a style
- Fixed issues with -webkit properties
- Comment header for styles installed from Stylebot Social
- Bugfixes

## Version 1.3

- New design for Options Page
- Fixed issue where selectors of the type `ul li` and `ul > li` were not working
- Prettier CSS editor in Options with syntax highlighting, line numbers and indentation!
- Syntax errors are shown when editing / importing CSS in the Options page
- Edit Global Stylesheet from Options page
- Modified the 'Toggle Styling' option in context menu
- UI Fixes for Stylebot Panel
- Options icon in Stylebot Panel
- Performance improvements: Updated to jQuery 1.6.1
- Bugfixes
- Special thanks to [@rduenasf](https://github.com/rduenasf) for this release

## Version 1.2

- Added support for comments in CSS (Thanks [Rodrigo](https://github.com/rduenasf))
- Fixed issue where CSS selectors containing ^= weren't working properly
- Added support for several vendor-specific CSS3 selectors (`@-webkit-keyframes` not supported yet)
- Added option to hide the css icon in Omnibar
- Bugfixes

## Version 1.1

- Added option to preview changes live when picking color using Color Picker. Available in Options page
- Use up / down arrows keys to increment / decrement integer values in Basic mode
- css icon indicates style is currently running on a page
- Optionally preview changes live when editing entire page's CSS. Also, the page CSS editor is opened inside the stylebot panel instead of a modal popup

## Version 1.0

- You can now share, browse and install styles from Stylebot Social
- Cleaner options page with vertical tabs
- Added option to temporarily disable custom styling of page in right click context menu
- Better Sync

## Version 0.2

- Added keyboard shortcuts (when stylebot panel is visible, press ?)
- Added Undo button. You can now undo upto last 5 actions
- More useful selector dropdown. On hover over a selector, first matched DOM element is highlighted. Also, it's now scrollable
- Added Height and Width properties to basic mode
- Other minor bugfixes

## Version 0.1

- First release
