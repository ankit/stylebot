/*
 * Built from the logo's colors: pink selectors, cyan properties, amber
 * values and blue at-rules, with URLs and punctuation in quiet grey.
 */
export default {
  base: 'vs',
  inherit: true,
  rules: [
    { token: '', foreground: '3a3f47' },
    { token: 'comment', foreground: '9aa0aa', fontStyle: 'italic' },
    { token: 'keyword', foreground: '5b7bd6' },
    { token: 'tag', foreground: 'c0507f' },
    { token: 'attribute.name', foreground: '2f86a6' },
    { token: 'attribute.value', foreground: 'a8742c' },
    { token: 'attribute.value.number.css', foreground: 'a8742c' },
    { token: 'attribute.value.unit.css', foreground: 'a8742c' },
    { token: 'attribute.value.hex.css', foreground: 'a8742c' },
    { token: 'string', foreground: '9aa0aa' },
    { token: 'delimiter', foreground: '9aa0aa' },
    { token: 'delimiter.bracket', foreground: '9aa0aa' },
    { token: 'delimiter.parenthesis', foreground: '9aa0aa' },
  ],
  colors: {
    'editor.background': '#fcfcfd',
    'editor.foreground': '#3a3f47',
    'editorCursor.foreground': '#2a5fd6',
    'editor.selectionBackground': '#2a5fd62e',
    'editor.inactiveSelectionBackground': '#2a5fd61a',
    'editor.selectionHighlightBackground': '#2a5fd614',
    'editorIndentGuide.background1': '#eceef1',
    'editorIndentGuide.activeBackground1': '#d8dbe1',
    'editorLineNumber.foreground': '#b9bec8',
    'editorLineNumber.activeForeground': '#6b7280',
    'editorBracketMatch.background': '#2a5fd614',
    'editorBracketMatch.border': '#2a5fd600',
    'editorBracketHighlight.foreground1': '#9aa0aa',
    'editorBracketHighlight.foreground2': '#9aa0aa',
    'editorBracketHighlight.foreground3': '#9aa0aa',
    'editorBracketHighlight.foreground4': '#9aa0aa',
    'editorBracketHighlight.foreground5': '#9aa0aa',
    'editorBracketHighlight.foreground6': '#9aa0aa',
  },
};
