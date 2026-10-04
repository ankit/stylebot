---
name: eval-chat
description: Measure whether a change makes Chat's styling replies better, with `yarn eval:chat` — it runs styling requests on recorded real pages for two versions of Stylebot and has a model grade and compare the results. Use after changing Chat's prompt, the page outline or CSS context it sends, or how replies are applied or checked, before claiming the change helps; when the user asks "is this better?", "run the evals", or wants numbers for a PR.
---

# Evaluate Chat's styling

Unit tests show Chat's plumbing works, not that its replies look better. `yarn eval:chat`
measures that: each case is a request on a recorded page ("Make this page a Gruvbox dark
theme" on Hacker News), run for a base and a head version, then graded from before/after
screenshots and compared side by side. Model calls go through headless Claude Code on the
user's subscription, not an API key. `docs/chat.md` describes the harness; this is how to
use it well.

## 1. Run it

From the checkout with the change, after `yarn install`:

```
yarn eval:chat --base HEAD --head . --tags theme --judge sonnet
```

- **Compare against the previous commit** (`--base HEAD --head .`) while iterating, so the
  numbers isolate this change; compare against `v4` for a PR's description.
- **Iterate on a subset**: `--tags` (theme, readability, typography, layout, hide, taste)
  or `--cases`, one run, `--judge sonnet`. Before a PR, run every case with `--runs 3`
  and the default Opus judge.
- **Run it in the background** and wait for `Results in …`; a full cold run takes about
  six minutes, and results are cached by the code that produced them, so an unchanged
  base costs nothing the second time.
- New pages are recorded on first use. Check a new site loads headless before adding it:
  Reddit and Stack Overflow block it, and some news sites cover the page with a consent
  dialog that the screenshots then grade.

## 2. Read it

Open `summary.md` in the results folder.

- **Trust the side-by-side preference most**, then counts like unreadable text. The 1–5
  scores swing by about half a point between identical runs (the same base has scored 5,
  then 3); one run is a hint, three are evidence.
- **Look before you believe a surprising score.** Each case's folder has the screenshots,
  the conversation and the stylesheet. Harness bugs have looked like model failures: web
  fonts not loaded before the screenshot, a page's CSP blocking the injected script.
- **Read the judge's defects for patterns** that repeat across cases; those are what to fix.

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

In the PR description, give the comparison against `v4`: the overall row (done, looks,
aesthetics, unreadable), the side-by-side tally, the model and runs, and any case that got
worse. Say it's Haiku-only if it is.
