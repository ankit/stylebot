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
- [Profiles](profiles.md) — several named stylesheets per site, how they're stored, saved and synced
- [Sync](sync.md) — Google Drive sync and its three-way merge
