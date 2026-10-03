---
name: translate
description: Translate Stylebot's locale strings — fill in strings that English has and other locales lack, retranslate English strings that changed, or add a whole new locale (e.g. "/translate add vi"). Use after adding or changing any string in src/assets/_locales/en.config, when `yarn validate-locales` reports missing translations, or when the user asks to add or improve a language.
---

# Translate Stylebot

Stylebot's UI strings live in `src/assets/_locales/<locale>.config`, one file per
locale; `en.config` is the source. CI's `yarn validate-locales` fails while any
string English has is missing from another locale, so every string needs every
locale. This skill is how they get filled in.

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
