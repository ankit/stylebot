# Chat

The Chat tab lets a user describe a change in words and have a language model write the CSS for the site they're on. Users bring their own API key, so there is no Stylebot backend and no billing. This page is the summary; the code comments carry the detail.

## Providers

Claude (Anthropic), OpenAI and Gemini are supported. Each sits behind one small adapter with two jobs: check that a key works, and stream one reply. An adapter translates Stylebot's provider-neutral thread into its API's format and turns the streamed response back into a common set of events: text as it arrives, the CSS edits once they are complete, token usage, and done or an error. Adding a provider means writing one adapter and listing its models; nothing else changes.

Requests go straight from the browser to the provider over plain `fetch` and server-sent events, with no SDKs and no new host permissions. Each model can carry extra request fields, such as a reasoning effort, merged into every request.

## Keys and what is stored

| Where | Key                       | What                                                   |
| :---- | :------------------------ | :----------------------------------------------------- |
| local | `chat-provider`           | the provider last picked, which replies come from      |
| local | `chat-api-key-<provider>` | that provider's key                                    |
| local | `chat-model-<provider>`   | the model picked for that provider                     |
| local | `chat-thread-<site>`      | the site's conversation, capped at its latest 50 turns |

One entry per value, so every write is a single set or remove and nothing needs serialising across a service worker restart. None of it is synced, and it is kept out of the options that content scripts receive.

**Keys never leave the background.** The editor only learns, for each provider, whether it is connected, its model and a masked copy of its key. Connecting rejects a key with another provider's prefix before any request, then checks the key with the provider before storing it.

## Several providers

Any number of providers can be connected at once, from the Providers screen. Replies come from the provider whose model was last picked in the model menu, which lists the current provider's models and opens the others' in place. Adding a key doesn't change which provider replies unless none was connected; removing the key of the one in use moves replies to another connected provider, and removing the last key turns Chat off.

## A reply

1. **The editor builds the prompt**, since it has the page at hand: what Stylebot is and how to answer, a compact outline of the page's visible elements (repeated rows folded, so a long list doesn't crowd out what comes after it), the page's CSS variables (its base palette first, when a design system defines thousands), the rules for the picked element if one is picked, and the site's current Stylebot stylesheet.
2. **The background streams the reply** over a port: it adds the key and model, calls the provider, and forwards each event. Closing the port (Stop, New chat, the editor closing) aborts the request; an open port keeps the service worker alive for the length of the reply.
3. **The model answers in prose and one tool call.** The tool takes a list of selectors, each with property and value pairs, under a strict schema. Asking for structured edits instead of free CSS is what makes each reply exactly undoable.
4. **The edits are applied like any other edit**: live on the page, saved, and one step on the editor's undo trail. A Google Fonts import is added for any font family the model picks.

A failed reply keeps the user's message and offers to send it again with the same picked element and image.

## Undo and Reapply

Applying a reply records, for every declaration it set, the value it replaced or that there was none. Undo puts exactly those back, and drops imports of fonts no longer used. Only the latest reply can be undone from the chat, since later replies may build on earlier ones. When the thread is sent again, each reply's edits are replayed as its tool call, with a result saying whether they are still applied, so the model knows what the page looks like now.

## Context from the user

- **A picked element.** The inspector works in Chat. A message sent with an element picked is about that element: its selector is named in the prompt and its page rules are included.
- **An image.** A screenshot can be pasted, an image dropped or picked from disk. It is scaled down to what the models read in detail and kept as PNG unless that gets large. No capture permission is needed.

## Cost

Providers report tokens, not money, and prices change, so the Chat tab shows no cost. The API key screen links to the provider's own usage page.

## Evaluating prompt changes

Unit tests show the plumbing works, not that replies got better. `yarn eval:chat` measures that: it runs a set of styling requests, listed beside the script, against recorded copies of real pages, once for a base version of Stylebot (`v4` by default) and once for the working tree, and compares them.

Each version's own prompt and page-reading code is built from its checkout, so the comparison is of what each would ship. Model calls go through headless Claude Code, billed to the signed-in Claude subscription rather than an API key, with the reply returned in the same shape as the tool call. Where a version checks its own edits and fixes what the check finds, the run does the same.

A stronger model grades each result from before and after screenshots: whether the request was done, how polished and how pleasing it looks, and the defects it sees. It also compares the two versions' results side by side, shown in a random order, which is steadier than their scores. Once Chat has a page check, the same check, run against the original page, also counts the text each result left hard to read, the surfaces a theme missed and the declarations the page overrode. A summary table is written to a timestamped results folder, beside each case's screenshots, conversation and stylesheet.

- `--base <ref>` / `--head <ref>`: the versions to compare; `.` is the working tree.
- `--model haiku`, `--judge opus`: the model replying and the one grading.
- `--cases a,b`, `--tags theme,layout`, `--runs 3`: a subset by name or by kind of request (theme, readability, typography, layout, hide, taste), and how many times to run each, since replies vary.
- `--record`: records the pages again; otherwise each is recorded once and reused.
- `--concurrency 6`: how many cases run at once.
- `--fresh`: runs everything again instead of reusing cached results.

Results are cached by what produced them: the code each version runs, the case and run number, the models, and the harness. Rerunning against an unchanged base, or after a change that leaves one version's code alone, only runs what changed, and a side-by-side verdict is reused while both of its results are. Haiku is called without extended thinking, as the extension calls it.

It costs subscription usage and takes minutes, so it isn't part of CI. While iterating, run a subset with one run and `--judge sonnet`; before merging a change to the prompt, the page outline or the page check, run every case with `--runs 3`.
