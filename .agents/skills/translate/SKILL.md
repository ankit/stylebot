---
name: translate
description: Translate Stylebot's locale strings, in the extension or on stylebot.dev — fill in strings that English has and other locales lack, retranslate English strings that changed, or add a whole new locale (e.g. "/translate add vi"). Use after adding or changing any string in src/assets/_locales/en.config or site/src/i18n/en/, when `yarn validate-locales` or the site's checks report missing translations, or when the user asks to add or improve a language.
---

# Translate Stylebot

Stylebot's UI strings live in `src/assets/_locales/<locale>.config`, one file per
locale; `en.config` is the source. CI's `yarn validate-locales` fails while any
string English has is missing from another locale, so every string needs every
locale. This skill is how they get filled in.

The website, stylebot.dev, has its own catalogs; see "The website" at the end.
The guidance on translating well applies to both.

## The file format

```
#==== Section ====

# Theme name in the reader's theme picker.
@light_theme
Light

@restore_add_back_site
Add back $site$
```

- `@key` on its own line, the text on the next line(s), a blank line between
  entries. Keep keys in the same order as `en.config`, under the same section
  headers.
- `#` lines are comments, stripped by the build. A `#` line directly above a
  key in `en.config` is a note for translators: read it, and add one when you
  add a string whose meaning isn't obvious from its words.
- The text can't contain `@` — the parser starts a new string at every `@`.
- `$NAME$` is a placeholder. Copy it exactly (same name, same case); move it
  wherever the sentence needs it. The validator fails on mismatches.
- `language_code` isn't translated: it's the file's own locale with a hyphen
  (`ja`, `zh-TW`, `pt-BR`), set as the UI's `lang` so fonts follow it.
- `store_listing` and `privacy_policy` are multi-paragraph store copy, not UI;
  translate them too, keeping the paragraphs and bullet characters.

## What to translate

1. **Missing strings.** Run `yarn validate-locales`; every "missing
   translation" error is a string to add.
2. **Changed English.** A string that changed in `en.config` on this branch
   needs retranslating even though every locale has it:
   `git diff origin/v4 -- src/assets/_locales/en.config` (or the branch's base).
   A renamed key counts as removed and added: rename it in every locale.
3. **A new locale** (`/translate add <code>`): create `<code>.config` with every
   section and key of `en.config`, translated. Use a code Chrome supports
   (developer.chrome.com/docs/extensions/reference/api/i18n#locales) — nothing
   else in the repo lists locales.

## Audit a locale

For `/translate audit <code>`: review a whole locale that already passes the
validator, as one pass with its own PR.

1. `yarn validate-locales --audit <code>` lists what to look at first:
   strings identical to English (a loanword, or untranslated?), "..." for
   "…", stray spaces, and short labels much longer than the English.
2. Read the whole file against `en.config`, top to bottom, applying "Sound
   native" below and the locale's per-language note. Fix untranslated
   strings, calques, typos and grammar, register and terminology drift.
   Store copy (`store_listing`, `privacy_policy`) is the oldest text and
   usually needs the most.
3. Look at it in the extension with `yarn dev:chrome:locale <code>`: the tab
   row, segmented controls, the shortcuts view, menus and the popup are
   the tight spots.
4. In the PR, list every changed string with its English and why it
   changed, in English, so it can be reviewed without reading the language.
   Say what still needs a native speaker's eye.

## How to translate well

- **Look at where a string is used** before translating a short or ambiguous
  one: `grep -rn "'<key>'" src` and read the component. "Light" is a theme name
  in one place and a font weight in another; "Style" may be a noun (a site's
  CSS) or a verb.
- **UI register:** short, plain, the way the platform's own UI says it in that
  language. Sentence case where the language has case. Buttons and menu items
  are actions ("Copy CSS"), not descriptions.
- **Length:** many strings sit in tight buttons, tabs, segmented controls and
  menus. Prefer the shorter natural wording; check the component when a
  translation runs much longer than the English.
- **Punctuation:** use the language's own quotes (« », „ “, 「」, “ ”), ellipsis
  "…", and spacing rules (a space before ? ! : ; in French).
- **Consistency:** reuse the wording the locale already uses for the same
  concept — read neighbouring strings in that locale file before writing.

## Sound native

Write what a native speaker would put in this spot of a well-made app in
their language, not the English sentence in other words. Translate the
meaning, then let the language's own grammar and word order carry it.

- **Read it back as a native user.** If a sentence would only make sense to
  someone who knows the English behind it, rewrite it.
- **No articles or filler the language doesn't use.** English "a/an" becomes
  nothing in most languages; don't render it as "one" (Vietnamese "một",
  Chinese "一个") unless something is being counted.
- **Name the subject.** English "it" for a feature or "you" in every sentence
  sounds foreign in many languages. Restructure, or name the thing ("this
  feature", "AI", "Stylebot").
- **Feature names aren't sentence subjects** unless that's natural in the
  language: "Chat uses your own API key" becomes "this feature uses…", not the
  tab label used as a noun.
- **Follow the platform's wording.** For common actions and settings (save,
  undo, sign in, dark mode, shortcut), use the terms Chrome and the OS use in
  that language.
- **Keep one register per locale.** Match the formality the file already
  uses and keep to it.

Per language (what each file already does; when touching a string that
breaks it, bring it in line):

- **Vietnamese:** "bạn" for the user; drop "một" unless counting; avoid "nó"
  for features; "Hãy …" is natural for instructions in messages, not on
  buttons.
- **Japanese:** sentences in です/ます; buttons and labels as short nouns or
  verb stems (保存, 削除); leave out あなた, which a few strings still use.
- **Chinese (Simplified and Traditional):** 你, not 您 (a few strings still
  use 您); leave the pronoun out where context makes it clear. Traditional
  uses Taiwan's terms (檔案, 網站, 設定), not Mainland ones.
- **Korean:** 합니다 in statements, 하세요 in requests; short nouns on
  buttons; never 당신.
- **German:** "Sie" (some strings still use "du"/"dein").
- **French:** "vous". **Spanish, Italian, Romanian:** informal "tú/tu".
  **Portuguese (both):** "você".
- **Russian:** "вы", lowercase.

## Glossary

Never translated: Stylebot, CSS, HTML, URL, Google Drive, Google Fonts,
Claude, Gemini, OpenAI, model names (Sonnet 5, GPT-5.6 Luna…), keyboard keys
(Esc, Alt, Shift, ⌘).

Keep the meaning, translate the word:

| English | Meaning in Stylebot |
|---|---|
| style | the CSS a user saved for one site (noun) |
| styling | Stylebot's CSS being applied on a page |
| selector | a CSS selector, as in CSS documentation in that language |
| preset | a ready-made set of styles (dark mode, grayscale…) |
| readability / reader | the reading view that strips a page to its article |
| panel / editor | Stylebot's side panel where styles are edited |
| Light / Dark / Sepia / System | theme names, as the OS or browser names its themes |
| provider | an AI company whose API key the user adds |

## Finish

1. `yarn validate-locales` passes with no errors.
2. For a new locale, read the ten longest translations against their
   components and shorten any that would crowd their control.
3. Commit the locale files with the change that needed them.

## The website

stylebot.dev's strings live in `site/src/i18n/<code>/site.ts` (pages) and
`demo.ts` (the landing page's demo), one folder per locale; `en/` is the
source. The header comment in `en/site.ts` explains the string format: inline
HTML, `{name}` placeholders and `[[alt+shift+M]]` keys, which a translation
keeps intact. Comments above a key are notes for translators. Run the site's
scripts from `site/` with Node 24 (`site/.nvmrc`).

1. **After changing English**, in the same change, run
   `node scripts/migrate-messages.ts`. Keys whose English is new or changed
   get it as a placeholder in every locale, so every page still builds, and
   the script prints them: that list is what to translate. Pass
   `--rename <catalog>:<new.path>=<old.path>` for a key that moved with its
   English unchanged, so its translations move too; `--from <ref>` if the
   English change is already committed. Re-running it never overwrites a
   translation someone has already updated.
2. **Translate only the listed keys**, in each locale. One subagent per locale
   works well. Reuse the terms that locale's catalog already uses, and the
   extension's wording: `node scripts/extension-terms.ts --glossary <code>`
   lists every site string that matches an extension string, with the
   extension's translation. Mock UI in the demo and feature cards must use it
   exactly.
3. **Site-specific rules:**
   - The demos' sample news story is translated, the same way in `demo.ts`
     (`article`) and `site.ts` (`cli.demo`). The paper's name, The Harbour
     Post, stays, as do CLI output, commands, theme and site names, and
     profile names that appear in screenshots.
   - `home.titleWord` is a button that cycles through decorative fonts:
     keep it one short word, and put `{word}` first in `home.title` where
     the language allows, since wider fonts grow it to the left. A new
     script may need its own font set in `[...lang]/index.astro`.
   - Numbers, dates and times follow the locale (`200.000+`, `23:41`).
   - Localized pages tell browsers not to translate them, so a mistranslation
     there is what visitors see.
4. **Adding a site locale:** add it to `LOCALES` in `site/src/i18n/locales.ts`,
   create its two catalogs with every key translated, register them in
   `site/src/i18n/index.ts`, and add it to `SITE_LOCALES` in
   `src/core/utils/site-url.ts` so the extension links to it.
5. **Finish:** `yarn run check` in `site/` (not `yarn check`, Yarn's own
   command) runs the type check, `scripts/check-messages.ts` (keys,
   placeholders, tags) and `scripts/extension-terms.ts` (extension wording);
   CI's `site` workflow runs the same checks. Then `npx astro build`, and look at a long language (German, Russian) at
   375px for overflow in buttons, the header and the demo. When moving
   existing English into the catalog, compare the English pages' text with
   a build from before the change: it should be identical.
