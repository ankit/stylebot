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
