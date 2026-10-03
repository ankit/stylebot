# Profiles

A site's style can hold several named stylesheets, called profiles: a plain one and a dark one for the same site, say. One profile is applied at a time. Switching swaps the CSS on the page, and edits go to the profile that's applied. The style's on/off switch still turns the whole style off, and the chosen profile is kept for when it's turned back on.

This page is the summary; the code comments carry the detail.

## How a style stores its profiles

The applied profile's CSS stays in the style's `css`, exactly where a style without profiles keeps it. The other profiles sit in a `profiles` map next to it, and `activeProfile` names the applied one:

```json
{
  "css": "body { background: #1c1e22; }",
  "enabled": true,
  "activeProfile": "c1f0…",
  "profiles": {
    "default": { "name": "", "css": "body { max-width: 72ch; }" },
    "c1f0…": { "name": "Dark" }
  }
}
```

Keeping the applied CSS in `css` means everything that compiles, injects and caches styles reads it as before, so applying a profile costs nothing, and a version of Stylebot from before profiles still sees a working style.

- **No profiles** means one unnamed profile, `default`, shown as "Default". Existing styles need no migration.
- **The applied profile's CSS lives only in `css`.** Its entry in `profiles` holds just its name.
- **Once a style has profiles, the field stays**, even when only one is left. A style that loses it was saved by an older Stylebot, which sync uses (below).
- **Ids are random**, apart from `default`. Names are unique within a style, ignoring case, though a sync merge can produce two with the same name.
- **Order** is the default profile first, then by name. Browser storage doesn't keep the order keys were added in.
- **Per style, not per profile:** on/off, Readability and Override site styles.

A style map read from outside the extension, an imported backup or the synced file, has its profiles repaired before use: entries without a name are dropped, an unknown applied id falls back to a profile, and any CSS stored against the applied profile is discarded in favour of `css`.

## Saving and switching

- **Edits name the profile they're for.** The editor saves to the profile it's showing, so if another tab or the popup switches profiles mid-edit, the edit still lands where it was made.
- **A switch reaches every open tab**, as turning a style on or off does. The editor's undo history starts over, since undoing past a switch would write one profile's CSS into another.
- **A style is deleted only once no profile has CSS.** A blank applied profile keeps the style, and it stays listed in the popup so it can be switched back.
- **The options page can edit a profile without applying it.** Its tabs open any profile; making one the applied profile is a separate action.

Users switch profiles from the editor's header, the popup and the options page, and create, rename, duplicate and delete them from the editor and the options page.

## Sync

Profiles merge one by one, with the same rules as the styles they belong to (see [Sync](sync.md)):

- A profile changed on one side takes that side; one edited on both merges its CSS with the line-level diff3, conflicts and all.
- A rename made on one side wins; when both sides renamed, the newer edit does. The applied profile follows the newer edit.
- **A profile is deleted only when the copy that deleted it is the newer edit of the style.** An older copy missing a profile is more likely stale than deliberate, so the profile is kept.
- **A copy from an older Stylebot** has lost its profiles. The merge gives them back from the base, treating that copy's `css` as an edit to the applied profile.

One case can still remove a style everywhere: on an older Stylebot, clearing all the CSS of a style whose applied profile is blank deletes the style, and sync carries the deletion. Version history keeps it, so it can be restored.

## Version history, import and export

Version history snapshots whole styles, so a switch, a rename or an edit to a profile that isn't applied is a change like any other, and restoring a version brings back every profile it had. Backups export profiles as part of the style map, and an import rejects a file that isn't a map of styles.
