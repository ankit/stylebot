# Stylebot CLI

Restyle websites in your browser from the command line, through the [Stylebot](https://stylebot.dev) extension. List tabs, read pages, save CSS that applies live, and take screenshots, from scripts or coding agents such as Claude Code.

## Requirements

- Stylebot 4 or later in Chrome or Edge (Brave, Chromium, Vivaldi and Arc work too)
- Node 20 or later

## Setup

```bash
npm install -g @stylebot/cli
stylebot install
```

`stylebot install` registers the CLI with your browsers. Then turn on **Allow command line access** in Stylebot's settings.

## Commands

```bash
stylebot tabs
stylebot open news.ycombinator.com
stylebot outline 1234
stylebot css set news.ycombinator.com --file hn.css
stylebot css rule 1234 '.titleline a' --set color=#e8e6e3
stylebot screenshot 1234 -o page.png
```

`stylebot --help` lists every command.

## CLI mode

Connect a tab to your agent and work with it from the page: mark areas by dragging over them and write notes about them in a small terminal, which shows what the agent does there, with an undo for each save.

```bash
stylebot watch
stylebot selection 1234
stylebot say 1234 'Made the header sticky.'
stylebot mode 1234 --off
```

`watch` follows what you do as it happens, `selection` lists the notes and marks sent since the agent last looked, and `say` answers your note in the terminal.

## Coding agents

The Stylebot skill lets coding agents such as Claude Code, Codex, Copilot and Cursor restyle sites with this CLI. Ask for a look, such as "give Hacker News a dark theme", and it writes the CSS, checks the page and looks at a screenshot.

## Privacy

The connection is off until you turn the setting on, and stays on your computer: the CLI talks to Stylebot through a local socket only you can read.

Learn more at [stylebot.dev/cli](https://stylebot.dev/cli).
