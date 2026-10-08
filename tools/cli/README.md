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

`stylebot install` registers the CLI with your browsers. Then turn on **Let apps on this computer control Stylebot** in Stylebot's settings.

## Commands

```bash
stylebot tabs
stylebot open news.ycombinator.com
stylebot outline 1234
stylebot css set news.ycombinator.com --file hn.css
stylebot screenshot 1234 -o page.png
```

`stylebot --help` lists every command.

## Claude Code

The Stylebot plugin for Claude Code restyles sites with this CLI. Ask for a look, such as "give Hacker News a dark theme", and it writes the CSS, checks the page and looks at a screenshot.

## Privacy

The connection is off until you turn the setting on, and stays on your computer: the CLI talks to Stylebot through a local socket only you can read.

Learn more at [stylebot.dev/cli](https://stylebot.dev/cli).
