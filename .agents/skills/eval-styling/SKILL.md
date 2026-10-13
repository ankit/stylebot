---
name: eval-styling
description: Measure whether a change makes Claude restyle pages better through Stylebot's /stylebot skill and `stylebot` CLI, with `yarn eval:styling` — it runs styling requests on recorded real pages through headless Claude Code for two versions of Stylebot and measures on the page whether each request was met. Use after changing the skill's instructions, what CLI commands print (the outline, CSS variables, page rules, the check after css set), or how CSS is saved and checked, before claiming the change helps; when the user asks "is this better?", "run the evals", or wants numbers for a PR.
---

# Evaluate styling through the CLI

Unit tests show the CLI's plumbing works, not that Claude restyles pages better with it.
`yarn eval:styling` measures that: each case is a request on a recorded page ("Make this
page an everforest theme with Fira Code as typography" on Hacker News), run as a whole
`/stylebot` session in headless Claude Code for a base and a head version, each with its
own extension, CLI and skill, then measured on the page Stylebot styles (a column's width,
a sidebar hidden, a font, a color) and shown in screenshots. The agent runs on the user's
subscription, not an API key. `docs/styling-evals.md` describes the harness; this is how
to use it well.

## 1. Run it

From the checkout with the change, after `yarn install`, with Chrome installed:

```
yarn eval:styling --base main --head .
```

- **Compare against the commit before the change** (`--base HEAD --head .` for
  uncommitted work) while iterating, so the numbers isolate it; compare against `main`
  for a PR's description. A base from before the CLI and its skill can't run.
- **Pick the cases a change targets** with `--cases` or `--tags` (theme, readability,
  typography, layout, hide, detailed, variables, look): every case is a full agent
  session, minutes and dollars each, not one reply. Before a PR, run the relevant ones
  with `--runs 3`. To compare models, give head its own with `--head-model`.
- **Run it in the background** and wait for `Results in …`; it ends by saying how many
  agent runs it made, their cost and how long it took. Results are cached by the code that
  produced them, so an unchanged base costs nothing the second time.
- New pages are recorded on first use. Check a new site loads headless before adding it:
  Reddit and Stack Overflow block it, and some news sites cover the page with a consent
  dialog that the screenshots and checks then measure instead of the page.

## 2. Read it

Open `summary.md` in the results folder.

- **Read "Case by case"**: every check for base and head, with the value the page had when
  one failed, then the original page and each version's result. Checks are the score;
  the screenshots are for what no check measures, like whether a theme looks good.
- **When reporting a run, show it**: each case's checks for base and head, and its
  screenshots, not only the overall numbers. One run is a hint, three are evidence.
- **Look before you believe a surprising score.** Each case's folder has the screenshots,
  the session's transcript, the files the agent wrote and the final stylesheet. Harness
  bugs have looked like model failures: web fonts not loaded before the screenshot, a page
  served live instead of from its recording.
- **Read the transcript for how it got there**: which commands it ran, what `css set`
  reported, whether it looked at a screenshot. `denied` above zero means the skill asks
  for something its allowed tools don't cover.
- **Look for failures that repeat across cases**; those are what to fix. When the
  screenshots show a problem no check catches, add a check (see `docs/styling-evals.md`).
- **Changing a case's checks?** Run `yarn eval:styling --references --cases <id>` first: no
  agent runs, and every check should pass with the case's reference stylesheet. Write a
  reference for a case that doesn't have one yet.

## 3. Improve what it finds

What moved the scores, roughly in order:

- **Context before wording.** The biggest wins came from what the model was shown, not
  from instructions: an outline cut off before the footer, a header with no selectable
  trait until the outline named its `bgcolor`, a design system's base palette buried under
  thousands of CSS variables.
- **Give absolute values where the model can't see the current ones.** It can't see
  spacing, so "make it compact" nudged padding and made rows taller.
- **Feedback on the model's own edits must name the cause.** Naming the symptom made a fix
  recolor every title dark on dark.
- **Watch for instructions that conflict on real pages**: "links get the accent" turned
  list sites, whose titles are links, into a wall of one color.
- **Re-run the cases a change might hurt**, not only the ones it targets: telling the
  model to be bold on look requests helped those and hurt others.

## 4. Report it

In the PR description, give the comparison against `main`: the overall row (checks,
unreadable, zero-match, turns, cost), the model and runs, and any case that got worse.
