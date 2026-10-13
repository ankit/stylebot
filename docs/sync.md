# Sync

Keeps a user's styles the same on every browser they sign in to, using a single file in their Google Drive. This page is the summary; the code comments carry the detail.

## What is stored

| Where | Key                                | What                                                                                                                                                                                      |
| :---- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drive | `stylebot/stylebot_v3_backup.json` | the style map, bare — same format as every earlier version                                                                                                                                |
| local | `styles`                           | the live style map                                                                                                                                                                        |
| local | `google-drive-sync-state`          | what the last successful run observed: the remote revision (Drive's modified time), the local revision, when it finished, the file metadata, the account, any conflicts, and **the base** |
| local | `google-drive-sync-enabled`        | the user's setting; kept apart from the state so it is cheap to read and never contends with a run's write                                                                                |
| local | `google-drive-access-token`        | the cached token and its expiry                                                                                                                                                           |
| local | `google-drive-sync-needs-auth`     | set by a scheduled run that could not get a token silently                                                                                                                                |
| local | `google-drive-refresh-token`       | the refresh token that keeps runs silent; removed on disconnect                                                                                                                           |

The base is a second copy of the style map: the one both sides agreed on at the end of the last sync. Storage is not a concern — the extension declares `unlimitedStorage` — and it is only ever read by a run.

## A run

1. **Skip if nothing moved.** The revisions recorded last time are compared with the current ones **for equality only**. Ordering them would compare one machine's clock with another's, and cannot express "unchanged".
2. **Merge, per url, against the base.** A side that still equals the base did not act, so the other side's edit — or deletion — carries over. Identical edits on both sides keep one copy; an edit beats a deletion; a style added on one side is kept. Equality ignores timestamps and whitespace, so a reformat is not an edit.
3. **Merge CSS edited on both sides** with a line-level diff3 of local, base and remote. Hunks only one side touched apply cleanly. Where both sides rewrote the same lines, the newer edit stays live and the other side's lines are appended in a `/* Stylebot sync conflict on <date>: another device had … */` comment — never as conflict markers, since the sheet is injected straight into pages — and the url is listed in the Sync tab for review.
4. **Write only where the result differs** — by the same equality as the merge, so a side that differs only in timestamps or whitespace is left alone — and only if the other side has not moved meanwhile: the file's metadata is re-read before uploading, and the local write is refused inside the write chain if an edit landed since the run read its snapshot. Either way the run starts over from a fresh read, once.
5. **Record the new base**, last, after both writes succeeded. It is kept byte for byte what Drive holds — the merged result after an upload, the downloaded copy when the upload was skipped — so an unchanged remote can still stand in for a download. A base behind reality only costs a conflict; one ahead of it loses data. A failed upload therefore leaves local ahead of the base, and the next run pushes it.

Without a base — first sync, reinstall, or a profile that synced before it was recorded — the run falls back to a newest-wins union per style, once.

## When runs happen

`chrome.alarms`, so the MV3 service worker need not stay alive: every 30 minutes, 30 seconds after the last local edit settles, on browser start, and on **Sync now**. Sync's own writes are marked as such, so a pull does not schedule a push. Overlapping runs coalesce into one.

Scheduled runs are non-interactive: the token comes from the cache, then the refresh token; if neither works, `needs-auth` is set and the Sync tab and popup ask for a sign-in rather than opening a window with nobody in front of it. The cached token is retired a minute early so a run does not fail halfway with a 401; a 401 anyway clears it and retries once.

## Failure modes, by design

- **Two devices upload at once** — the pre-upload metadata check catches it; the loser restarts from the winner's copy.
- **Upload fails after the local write** — no state is recorded, so the next run sees local ahead and pushes.
- **The file is edited by hand in Drive** — anything that is not a map of style objects is a `parse` error, shown in the UI, and never reaches the merge.
- **Disconnect during a run** — the run's final state write is refused, so reconnecting starts clean.
- **A style deleted on both devices** — stays deleted.

## Signing in

Every browser signs in against a **Desktop app** OAuth client, with PKCE and offline access, and keeps the refresh token it gets. Scheduled runs trade it for access tokens with a plain request, so they never depend on the browser's Google session, its cookies, or which of several accounts is signed in. When Google stops honouring it, the next interactive sync signs in again.

A Desktop client only accepts a loopback redirect, so the browser has to catch Google's redirect to `127.0.0.1` before anything loads:

- **Chrome, Edge and Safari** sign in in an ordinary tab. A redirect rule the extension adds for the sign-in sends the loopback address to an extension page, which hands the code to the background; it closes the tab and returns to the one the user started from. Where the rule can't run, such as with the extension's site access limited, the background reads the code off the tab's loopback address instead. The sign-in in progress is kept in storage rather than memory, since the background may unload while the user is on Google's page; whichever background receives the code finishes it, and a second sync brings the open sign-in tab forward instead of opening another.
- **Firefox** signs in through its own auth window, which accepts a loopback address of its own and intercepts it, so it needs no redirect rule.

Google treats a Desktop client's secret as public, since it ships inside the extension, but it is kept out of the repository: builds read it from `STYLEBOT_GOOGLE_CLIENT_SECRET`. A release build fails without it; CI and development builds only warn, and sign-in fails in them.

### Profiles signed in before refresh tokens

Chrome, Edge and Firefox used to sign in against a **Web application** client through the browser's identity API, which gives only hour-long tokens and renews them with a hidden sign-in that fails whenever Google wants a click. Until such a profile has a refresh token, scheduled runs still renew that way, so a sign-in that keeps working isn't interrupted; its next interactive sync moves it to the Desktop client. This fallback is meant to go once most profiles have moved.

## Using sync from a local build or a fork

Signing in no longer depends on the extension's id, so an unpacked build can sign in as long as it was built with the client secret. Only the fallback above needs the store id, since the Web application client is registered for the store extension's redirect URL, `https://<extension id>.chromiumapp.org/`; dev builds (`yarn watch`, `yarn dev:chrome`) and `yarn build:preview` add the store's public key to get it, and `yarn preview:edge` builds with the Edge store's key instead.

A fork needs its own client:

1. In the [Google Cloud console](https://cloud.google.com/cloud-console), create a project and enable the **Google Drive API**.
2. Under **OAuth consent screen**, choose Internal (local use, or within an organisation) or External (a published fork), add the scope `https://www.googleapis.com/auth/drive.file`, and publish it: refresh tokens for a consent screen left in testing expire after a week.
3. Under **Credentials**, create an **OAuth client ID** of type Desktop app. Replace the Desktop client ID in the sync code with it, and build with its secret in `STYLEBOT_GOOGLE_CLIENT_SECRET`.

Drive only shows a client the files its own project created, so every client that reads the sync file has to be in the same project.
