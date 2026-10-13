# Styling evals

Unit tests show the command line's plumbing works, not that Claude restyles pages better with it. `yarn eval:styling` measures that: it runs a handful of real styling requests through the `/stylebot` skill on recorded pages, for two versions of Stylebot, and measures on the page whether each request was met.

What decides the result is the skill's instructions and what the `stylebot` commands print: the page outline, its CSS variables, the site's own rules, and the page check after each save. A change to any of them is worth an eval.

## Running it

```bash
yarn eval:styling --base main --head .
```

That compares the working tree with `main` on every case, once each. Open `summary.md` in the results folder it prints. Common variations:

- **Before a PR**, compare against `main` with `--runs 3`, since runs vary, and put the overall row and any case that got worse in the PR.
- **A subset**: `--cases github-dracula` or `--tags layout`.
- **Another model**: `--head-model claude-opus-5-5` gives head a different model or effort, to answer "would Opus do better?" in one run.
- **Only the references**: `--references` checks every case's reference in a few seconds, with no agent runs.

Each case is a whole Claude Code session, with dozens of commands, so a run takes minutes per case and costs far more than a single reply. Iterate on the cases a change targets.

## How it works

```mermaid
flowchart LR
    C[Cases: request + recorded page] --> B[Base version]
    C --> H[Head version]
    B --> R1[/stylebot session, CSS saved/]
    H --> R2[/stylebot session, CSS saved/]
    R1 --> M[Checks measured on the page]
    R2 --> M
    M --> T[summary.md, with screenshots]
```

- **Each version is built from its own checkout**, so the comparison is of what each would ship: its extension, its CLI and its skill. A version from before the CLI and its skill can't be evaluated, and the eval says so.
- **Each run gets a fresh browser** with that version's extension, command line access turned on and its CLI registered, as a user who set it up would have it. Nothing touches your browsers, your `~/.stylebot`, or your saved styles.
- **Pages are recorded once and replayed**, so both versions style the same page.
- **The agent is headless Claude Code** on the signed-in subscription, started from a folder outside the repo, so the project's instructions don't reach it. It loads only that version's plugin, with no user settings, other plugins or MCP servers, and may only run what the skill allows. A request with several steps continues the same session.
- **The skill's work folder is moved** into each run's own folder, so runs on the same site at once don't share files.
- **Results are cached by the code that produced them**, so rerunning against an unchanged base only runs what changed.

## Reading the summary

For each case, the summary has a table with one row per check and a column each for the unstyled page, the case's reference, base and head. A failed check shows the value the page had instead, such as `@contrast 1.22 (was 4.56)`. Below it are screenshots of the original page, the reference and both results, taken of the page as Stylebot styles it on a fresh visit.

Above the cases, tables give totals overall, by kind of request and by case:

| Column                                  | What it counts                                                                    |
| :-------------------------------------- | :-------------------------------------------------------------------------------- |
| **checks**                              | checks passed: whether each request was met, measured on the page                 |
| unreadable, missed surfaces, overridden | from the page check, on the final stylesheet                                      |
| zero-match                              | selectors in the final stylesheet that match nothing on the page                  |
| asked                                   | cases that ended with no CSS saved, as when the agent asks a question back        |
| denied                                  | tool calls refused as outside what the skill allows: the skill asked for too much |
| turns                                   | the agent's model calls                                                           |
| commands, saves                         | `stylebot` commands run, and how many of them saved CSS                           |
| tokens in, tokens out, cost             | mean per case; cost as Claude Code estimates it, with caching                     |
| seconds                                 | mean per case                                                                     |

Each case's folder also has the session's transcript, the final stylesheet, and the files the agent wrote: its CSS and the screenshots it looked at.

No model grades the results. An Opus judge once compared screenshots side by side, but between identical runs it agreed with itself about half the time, and it missed or invented details the checks measure: a font it said had changed, a color it didn't notice. What no check can measure, such as whether a theme looks good, is left to the screenshots.

Runs vary: with identical code on both sides, totals differ by a point or two and a single case by up to three checks. Trust a difference that holds across `--runs 3`.

## Cases

One case for each kind of request people make. Add a case when a kind of request isn't covered.

| Site                      | Request                                                                                                                            | What's checked                                                                                                       |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| Hacker News               | "Make this page an everforest theme with Fira Code as typography"                                                                  | Everforest colors on the page, top bar and search box; Fira Code titles; readable text                               |
| GitHub                    | "Give this page a Dracula theme"                                                                                                   | Dracula colors on every surface, from the site header to the readme; readable text                                   |
| Wikipedia                 | "Make the article read like a book": serif at 19px, 1.6 line height, a centered 680px column, sidebar and Appearance panel hidden  | each value; images kept                                                                                              |
| Lobsters                  | "Make it more compact so more stories fit on screen"                                                                               | rows 20% shorter and the footer on screen, without hiding stories or shrinking titles                                |
| React docs                | "Hide the sidebar and let the content use the space"                                                                               | sidebar hidden; content wider and centered                                                                           |
| A store (Books to Scrape) | 4 columns of cards with 12px corners, a 1px `#e5e7eb` border and soft shadow; bold green prices; full-width pill buttons           | each value; cards that keep their content inside, with nothing overlapping                                           |
| React docs                | Paper & ink, one of the suggested looks, asked in plain words: warm off-white paper, a bookish serif, a narrow column, brown links | paper color, serif, size, column width, link hue; readable text                                                      |
| Hacker News               | Terminal: a near-black background, phosphor green text, a monospace font throughout                                                | dark surfaces, green text, monospace; readable text and search box                                                   |
| Lobsters                  | Wabi-sabi: paper white, charcoal text, one vermilion accent, generous space, ads and decorative extras hidden                      | paper color, accent hue, taller rows; readable text; every story and the navigation still shown                      |
| Wikipedia                 | Night owl: a warm dark theme with amber links and images dimmed                                                                    | dark background, light text, amber links, dimmed images; readable text and table of contents                         |
| BBC News                  | Calm: quiet off-white colors, soft dark text, roomy lines, ads, promos, banners and pop-ups hidden                                 | the ad and the subscription banner hidden; quieter colors; readable text; every story and the navigation still shown |
| BBC News                  | Hide distractions: ads, promos, banners, pop-ups and other prompts, keeping the navigation and content                             | the ad and the subscription banner hidden; every story and the navigation still shown; headlines unchanged           |

Tags group the cases by kind of request (theme, readability, typography, layout, hide, detailed specs, design systems recolored through CSS variables, and the creative looks Stylebot suggests), and the summary totals each tag separately.

## Checks

A case lists checks for each step of its request, measured on the page after that step and compared with the unstyled page. Each names elements by selector and expects something of them:

| Expectation                                                     | Example                                                                    |
| :-------------------------------------------------------------- | :------------------------------------------------------------------------- |
| a computed style, exactly or within a tolerance                 | font size 19, line height 30.4±1, border color `#e5e7eb`                   |
| one of several values, or a pattern                             | a Gruvbox background; a serif font family                                  |
| relative to the unstyled page                                   | rows at most 0.8× as tall; links darker; body text the same                |
| a box: width, height, top, distance from center, parent's share | a 680px column within 40px of center; the footer within the first 900px    |
| the background behind the element, and its text's contrast      | a dark background; contrast of at least 4.5                                |
| hidden or still shown; columns in a grid                        | the sidebar hidden; images still shown; every story still shown; 4 columns |
| inside its container, and clear of other elements in it         | prices and buttons inside each card, not covering the cover or title       |

A check looks at the first element that showed before styling, unless it asks for every match or any match.

Some checks guard rather than measure the request: "titles are readable" passes on the unstyled page, and fails only if the result breaks it.

## References

Each case has a reference: a stylesheet for the result it should get. It does two jobs:

- **It shows what correct looks like**, as a column in every summary.
- **It tests the checks.** Every check should pass with it, and the checks about the request should fail on the unstyled page. A check that fails with the reference is broken, or the page was recorded again and changed.

Writing a reference is also how to find gaps: if its screenshot looks wrong but every check passes, a check is missing. That's how the checks for overlapping card content were found.

## Adding a case

1. **Check the site loads headless.** Reddit and Stack Overflow block headless browsers, and some news sites cover the page with a consent dialog.
2. **Add the request** to the cases file, with a few checks for what it asks and a guard or two for what it shouldn't break. The page is recorded on the first run, or again with `--record`.
3. **Write its reference** in the references folder, and run `--references --cases <id>` until every check passes with it and the request's checks fail without it.
4. **Look at the reference's screenshot**, and add a check for anything wrong that no check caught.

## What it has caught

These came from the eval's earlier form, which measured the in-extension Chat, but the page outline it improved is the one `stylebot outline` prints today.

**Repeated rows folded**: "apply the same theme to this page" on Hacker News. Before, the outline stopped at story 11, so the story list was left a bright orange slab:

![Hacker News themed Gruvbox: before, the story list stays orange; after, it's dark with cream titles](images/chat-eval-hn-same-theme.webp)

**Variables ranked and spread**: "Give this page a Dracula theme" on GitHub. Before, file names and tabs went dark on dark:

![GitHub themed Dracula: before, file names and tabs are invisible; after, every surface is readable](images/chat-eval-github-dracula.webp)

**Spacing in the outline**: "Make it more compact" on Lobsters. Before, guessed padding made the list taller; after, it was about 30% denser:

![Lobsters made compact: before, the list grows past the screen; after, all stories and the footer fit](images/chat-eval-lobsters-compact.webp)

## Options

| Option                           | Default                   |                                                    |
| :------------------------------- | :------------------------ | :------------------------------------------------- |
| `--base` / `--head`              | `main` / `.`              | the versions to compare; `.` is the working tree   |
| `--model` / `--effort`           | Sonnet 5.5, Claude Code's | the agent's model, by alias or full ID; its effort |
| `--head-model` / `--head-effort` | the same as base          | a different setup for head only                    |
| `--cases` / `--tags`             | all                       | a subset by name, or by tag                        |
| `--runs`                         | 1                         | runs per case                                      |
| `--concurrency`                  | 4                         | runs at once, each with its own browser            |
| `--record`                       | off                       | record the pages again                             |
| `--fresh`                        | off                       | ignore cached results                              |
| `--references`                   | off                       | only render and score the references               |
