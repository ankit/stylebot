---
name: eval-chat
description: Measure whether a change makes Chat's styling replies better, with `yarn eval:chat` — it runs styling requests on recorded real pages for two versions of Stylebot and measures on the page whether each request was met. Use after changing Chat's prompt, the page outline or CSS context it sends, or how replies are applied or checked, before claiming the change helps; when the user asks "is this better?", "run the evals", or wants numbers for a PR.
---

# Evaluate Chat's styling

Unit tests show Chat's plumbing works, not that its replies look better. `yarn eval:chat`
measures that: each case is a request on a recorded page ("Make this page an everforest
theme with Fira Code as typography" on Hacker News), run for a base and a head version,
then measured on the page (a column's width, a sidebar hidden, a font, a color) and shown
in screenshots. Model calls go through headless Claude Code on the user's subscription,
not an API key. `docs/chat-evals.md` describes the harness; this is how to
use it well.

## 1. Run it

From the checkout with the change, after `yarn install`:

```
yarn eval:chat --base HEAD --head .
```

- **Compare against the previous commit** (`--base HEAD --head .`) while iterating, so the
  numbers isolate this change; compare against `v4` for a PR's description.
- **Iterate on all six cases**, or the tags a change targets (theme, readability,
  typography, layout, hide, detailed, variables), one run. Before a PR, run them with
  `--runs 3`. To compare models or thinking, give head its own setup with `--head-model`
  or `--head-thinking`.
- **Run it in the background** and wait for `Results in …`; it ends by saying how many model
  calls it made and how long it took. Results are cached by the code that produced them,
  so an unchanged base costs nothing the second time.
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
  the conversation and the stylesheet. Harness bugs have looked like model failures: web
  fonts not loaded before the screenshot, a page's CSP blocking the injected script.
- **Look for failures that repeat across cases**; those are what to fix. When the
  screenshots show a problem no check catches, add a check (see `docs/chat-evals.md`).
- **Changing a case's checks?** Run `yarn eval:chat --references --cases <id>` first: no
  model calls, and every check should pass with the case's reference stylesheet. Write a
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

In the PR description, give the comparison against `v4`: the overall row (checks,
unreadable, zero-match, cost), the model setup and runs, and any case that got worse.
