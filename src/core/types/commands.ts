export type StylebotCommandName =
  | 'stylebot'
  | 'style'
  | 'readability'
  | 'grayscale';

export type StylebotCommands = {
  [key in StylebotCommandName]: string;
};

export type StylebotEditorCommandName =
  | 'inspect'
  | 'basic'
  | 'magic'
  | 'code'
  | 'chat'
  | 'help'
  | 'hide'
  | 'dockLeft'
  | 'dockRight'
  | 'dockWindow'
  | 'dockSidePanel'
  | 'pageLayout'
  | 'close';

export type StylebotEditorCommands = {
  [key in StylebotEditorCommandName]: string;
};
