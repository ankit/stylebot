# Stylebot docs

## Contributing

- [Development](development.md) — setup, dev builds, lint, tests
- [Releases](releases.md) — cutting a release
- [Translation](translation.md) — adding or improving a locale
- [CLI](cli.md) — driving a dev build from the command line or a coding agent

## Testing

- [e2e](e2e.md) — the Playwright suite against the real extension
- [Styling evals](styling-evals.md) — measuring whether a change makes Claude restyle pages better through the CLI

## Architecture

- [Editor](editor.md) — the in-page and windowed editor, and the page bridge between them
- [Side panel](side-panel.md) — docking the editor in Chrome's side panel, its optional permission, and the browsers that won't show it
- [Selectors](selectors.md) — how the inspector picks a selector for an element
- [CSS](css.md) — how edits land in the user's CSS, and how it's prepared and injected
- [Readability](readability.md) — the reader view and how it loads
- [Style storage](style-storage.md) — the style map, how a page finds its styles, and the copies kept to apply them fast
- [Profiles](profiles.md) — several named stylesheets per site, how they're stored, saved and synced
- [Style options](style-options.md) — options a style declares in its CSS, like the light/dark switch, and how choices are stored
- [Sync](sync.md) — Google Drive sync and its three-way merge
