# Coding agents

The Stylebot skill teaches a coding agent to restyle pages with the CLI: open the page, read its outline, write CSS, fix what the page check reports, then look at a screenshot. It works in any agent with a shell and a file-writing tool, running on the same machine as the browser, once the [setup](../cli.md#setup) is done. Ask for a look, such as "give Hacker News a dark theme", and the agent picks the skill up on its own; or invoke it by name. Without saying what to change, it offers suggestions for the page.

The skill keeps its CSS and screenshots in `~/.stylebot/work/`. When you name a profile, it updates that one, and in [CLI mode](cli-mode.md) the one you're using; otherwise its changes go into a new profile named after the agent and the look, such as "Claude: Dark", so switching back to your own style is one profile change.

Agents with plugin marketplaces install it from this repo's, as a plugin whose `stylebot` command runs the CLI on your `PATH`, or the published one through `npx` when there's none. The others copy the skill's folder, and need the CLI installed with `npm install -g @stylebot/cli`.

| Agent             | How                     | Checked                                          |
| ----------------- | ----------------------- | ------------------------------------------------ |
| Claude Code       | This repo's marketplace | Restyling measured by the styling evals          |
| Codex CLI         | This repo's marketplace | Installed and its skill listed, Codex 0.163.0    |
| Copilot CLI       | This repo's marketplace | Installed and its skill loaded, Copilot 1.0.99-2 |
| Copilot (VS Code) | Copy the skill          | From VS Code's docs only                         |
| Cursor            | Copy the skill          | From Cursor's docs only                          |
| Antigravity CLI   | Copy the skill          | From Antigravity's docs only                     |

How well an agent restyles pages is only measured with Claude Code (see [Styling evals](../styling-evals.md)); the others were checked for installing the skill and finding it, by the author of [#1223](https://github.com/ankit/stylebot/issues/1223). Each agent's commands and folders below follow its own docs as of October 2026.

## Claude Code

```bash
claude plugin marketplace add ankit/stylebot
```

```bash
claude plugin install stylebot
```

Use `./` in place of `ankit/stylebot` to install this checkout's plugin, or try it in one session with `claude --plugin-dir tools/agent-plugin`. Invoke it with `/stylebot <site> <what to change>`. It runs without permission prompts: the skill pre-approves `stylebot` commands and reading and writing files in `~/.stylebot/work/`.

## Codex CLI

```bash
codex plugin marketplace add ankit/stylebot
```

```bash
codex plugin add stylebot@stylebot
```

In a new session, ask for a look, or pick `stylebot` from `/skills`. To run `stylebot` commands without approving each one, choose to always allow them at the first prompt, or add a rule to `~/.codex/rules/default.rules`:

```python
prefix_rule(pattern = ["stylebot"], decision = "allow")
```

## Copilot CLI

```bash
copilot plugin marketplace add ankit/stylebot
```

```bash
copilot plugin install stylebot@stylebot
```

`copilot skill list` shows whether the skill loaded. Copilot doesn't keep command approvals between sessions: approve `stylebot` for the rest of the session at the first prompt, or start it with `copilot --allow-tool='shell(stylebot:*)'`.

## Copilot in VS Code, Cursor and Antigravity CLI

From this checkout, copy the skill folder into the agent's personal skills folder, then restart the agent:

| Agent             | Personal skills folder              | Project skills folder |
| ----------------- | ----------------------------------- | --------------------- |
| Copilot (VS Code) | `~/.copilot/skills/`                | `.github/skills/`     |
| Cursor            | `~/.cursor/skills/`                 | `.cursor/skills/`     |
| Antigravity CLI   | `~/.gemini/antigravity-cli/skills/` | `.agents/skills/`     |

```bash
cp -R tools/agent-plugin/skills/stylebot ~/.cursor/skills/
```

Copilot CLI reads `~/.copilot/skills/` too, and Cursor also reads `~/.claude/skills/`. Ask for a look, or type `/stylebot`.

To run `stylebot` commands without a prompt each time:

- **Copilot in VS Code**: add `"chat.tools.terminal.autoApprove": { "stylebot": true }` to your user settings.
- **Cursor**: pick Allowlist under Cursor Settings > Agents > Approvals & Execution, and add `stylebot` to the allowlist, or put `{ "terminalAllowlist": ["stylebot"] }` in `~/.cursor/permissions.json`, which replaces the allowlist in settings.
- **Antigravity CLI**: choose to always allow `stylebot` at the first prompt, or add `"permissions": { "allow": ["command(stylebot)"] }` to `~/.gemini/antigravity-cli/settings.json`.
