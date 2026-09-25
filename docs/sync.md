# Sync

Keeps a user's styles the same on every browser they sign in to, using a single file in their Google Drive. This page is the summary; the code comments carry the detail.

Code: `src/sync`.

## Modules

| Module                             | What it does                                                 |
| ---------------------------------- | ------------------------------------------------------------ |
| `google-drive/sync.ts`             | `runGoogleDriveSync()`, one sync run end to end              |
| `google-drive/sync-file.ts`        | The Drive client: find, download, upload, account lookup     |
| `google-drive/sync-metadata.ts`    | What is kept in `chrome.storage.local` between runs          |
| `google-drive/get-access-token.ts` | OAuth token, cached                                          |
| `merge/three-way.ts`               | Decides per url                                              |
| `merge/merge-css.ts`               | Merges CSS text                                              |
| `merge/diff3.ts`                   | Vendored line diff3                                          |
| `merge/merge-without-base.ts`      | The fallback when there is no base                           |
| `errors.ts`                        | `syncError(message, code)`, mapped to locale keys for the UI |
| `src/background/sync-scheduler.ts` | When runs happen                                             |

## What is stored

| Where | Key                                | What                                                                                                                                                                                                                       |
| ----- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drive | `stylebot/stylebot_v3_backup.json` | the style map, bare — same format as every earlier version                                                                                                                                                                 |
| local | `styles`                           | the live style map                                                                                                                                                                                                         |
| local | `google-drive-sync-state`          | what the last successful run observed: the remote revision (Drive's `modifiedTime`), the local revision (the `styles-metadata` stamp), `lastSyncedAt`, the file metadata, the account, any conflicts, and **`baseStyles`** |
| local | `google-drive-sync-enabled`        | the user's setting; kept apart from the state so it is cheap to read and never contends with a run's write                                                                                                                 |
| local | `google-drive-access-token`        | the cached token and its expiry                                                                                                                                                                                            |
| local | `google-drive-sync-needs-auth`     | set by a scheduled run that could not get a token silently                                                                                                                                                                 |

`baseStyles` is a second copy of the style map: the one both sides agreed on at the end of the last sync. Storage is not a concern — the extension declares `unlimitedStorage` — and it is only ever read by a run.

## A run

1. **Skip if nothing moved.** The revisions recorded last time are compared with the current ones **for equality only**. Ordering them would compare one machine's clock with another's, and cannot express "unchanged".
2. **Merge, per url, against the base.** A side that still equals the base did not act, so the other side's edit — or deletion — carries over. Identical edits on both sides keep one copy; an edit beats a deletion; a style added on one side is kept. Equality ignores `modifiedTime` and whitespace, so a reformat is not an edit.
3. **Merge CSS edited on both sides** with a line-level diff3 of local, base and remote. Hunks only one side touched apply cleanly. Where both sides rewrote the same lines, the newer edit stays live and the other side's lines are appended in a `/* Stylebot sync conflict on <date>: another device had … */` comment — never as conflict markers, since the sheet is injected straight into pages — and the url is listed in the Sync tab for review.
4. **Write only where the result differs** — by the same equality as the merge, so a side that differs only in `modifiedTime` or whitespace is left alone — and only if the other side has not moved meanwhile: the file's metadata is re-read before uploading, and the local write is refused inside the write chain if an edit landed since the run read its snapshot. Either way the run starts over from a fresh read, once.
5. **Record the new base**, last, after both writes succeeded. It is kept byte for byte what Drive holds — the merged result after an upload, the downloaded copy when the upload was skipped — so an unchanged remote can still stand in for a download. A base behind reality only costs a conflict; one ahead of it loses data. A failed upload therefore leaves local ahead of the base, and the next run pushes it.

Without a base — first sync, reinstall, or a profile that synced before it was recorded — the run falls back to a newest-wins union per style, once.

## When runs happen

`chrome.alarms`, so the MV3 service worker need not stay alive: every 30 minutes, 30 seconds after the last local edit settles, on browser start, and on **Sync now**. Sync's own writes are marked `fromSync` so a pull does not schedule a push. Overlapping runs coalesce into one.

Scheduled runs are non-interactive: the token comes from the cache, then a silent auth flow; if that fails, `needs-auth` is set and the Sync tab and popup ask for a sign-in rather than opening a window with nobody in front of it. The cached token is retired a minute early so a run does not fail halfway with a 401; a 401 anyway clears it and retries once.

## Failure modes, by design

- **Two devices upload at once** — the pre-upload metadata check catches it; the loser restarts from the winner's copy.
- **Upload fails after the local write** — no state is recorded, so the next run sees local ahead and pushes.
- **The file is edited by hand in Drive** — anything that is not a map of style objects is a `parse` error, shown in the UI, and never reaches the merge.
- **Disconnect during a run** — the run's final state write is refused, so reconnecting starts clean.
- **A style deleted on both devices** — stays deleted.

## Using sync from a local build or a fork

Google's OAuth client is registered for the store extension's redirect URL, `https://<extension id>.chromiumapp.org/`. An unpacked build gets a different id from its path, so sign-in fails with `redirect_uri_mismatch`.

Dev builds (`yarn watch`, `yarn dev:chrome`) and `yarn build:preview` (a production build in `preview-dist/`) merge the store's public key from `src/extension/manifest-dev.json` into the manifest, so they get the store id and sign-in works. `yarn dev:chrome` runs in its own profile; if you load `dist/` unpacked in your everyday profile instead, disable the store install first, since the two share an id. Release builds (`yarn build`) leave the key out.

A fork needs its own client:

1. In the [Google Cloud console](https://cloud.google.com/cloud-console), create a project and enable the **Google Drive API**.
2. Under **OAuth consent screen**, choose Internal (local use, or within an organisation) or External (a published fork), and add the scope `https://www.googleapis.com/auth/drive.file`.
3. Under **Credentials**, create an **OAuth client ID** of type Web application, with `https://<your extension id>.chromiumapp.org/` as an authorised redirect URI — `chrome.identity.getRedirectURL()` returns it.
4. Put the client ID in `CLIENT_ID` in `google-drive/get-access-token.ts`.
