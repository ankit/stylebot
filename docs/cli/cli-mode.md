# CLI mode

CLI mode lets you work with your agent from the page itself. A small terminal on the tab shows each command the agent runs and each save, with an undo. You mark parts of the page and leave notes, and the agent makes the change and replies.

<img src="../images/cli-mode.webp" width="450" alt="The CLI mode terminal on a GitHub issue: notes asking to fix three icon buttons and shrink the copy icon, each followed by the commands the agent ran, an undo, and its answer">

## Using it

1. **Connect.** Ask your agent to watch, then click **[connect]** on the tab you want to work on. Only one tab is connected at a time; others offer **[move here]**.
2. **Mark.** Drag over part of the page. Click a mark's number to remove it.
3. **Note.** Type in the terminal and press Enter (Shift+Enter for a new line). The agent gets your note with a screenshot of the marks.

| Key | Does               |
| --- | ------------------ |
| `.` | Open or minimize   |
| `/` | Write a note       |
| `Z` | Undo the last save |
| `X` | Clear the marks    |

The keys work anywhere on the page except in a text field.

## On the agent's side

```mermaid
sequenceDiagram
  participant You as You, on the page
  participant Agent
  Agent->>You: stylebot mode (or you click connect)
  You->>Agent: mark ① and a note
  Note over Agent: stylebot watch / selection
  Agent->>You: stylebot css rule … (shows in the terminal, with undo)
  Agent->>You: stylebot say "Done: …"
```

- `mode <tab>` connects a tab, and `mode <tab> --off` disconnects it.
- `watch` prints a line for each event: the tab connecting, marks, notes, navigation, and edits made outside the CLI.
- `selection` lists the notes and marks since it last looked, with the elements inside each mark. `--wait` waits for the next one.
- `say` answers your note in the terminal.
