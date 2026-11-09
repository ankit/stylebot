# CLI mode

CLI mode lets you work with your agent from the page. A small terminal on a connected tab shows each command the agent runs there and each save, with an undo. You mark areas of the page and write notes about them; the agent makes the change and answers in the terminal.

- **Connect**: ask your agent to watch, then click **[connect]** on the tab you're looking at, or let the agent connect one with `mode <tab>`. One tab is connected at a time; others offer **[move here]**. The terminal's close button or `mode <tab> --off` disconnects it.
- **Mark**: drag over part of the page. Click a mark's numbered badge to remove it.
- **Note**: type in the terminal and press Enter (Shift+Enter for a new line). The agent gets the note with a screenshot of your marks, and shows as thinking until it answers.

Keys, anywhere on the page but a field: `.` open or minimize, `/` write a note, `Z` undo the last save, `X` clear the marks.

The agent follows along with `watch`, which prints a line for each event (the tab attaching, each mark and note, navigations, edits outside the CLI), or `selection`, which lists the notes and marks sent since it last looked, with the elements inside each mark; `--wait` waits for the next one. `say` answers your note.

![The CLI mode terminal on a GitHub issue: notes asking to fix three icon buttons and shrink the copy icon, each followed by the commands the agent ran, an undo, and its answer](../images/cli-mode.webp)
