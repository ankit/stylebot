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
  | 'help'
  | 'hide'
  | 'dockLeft'
  | 'dockRight'
  | 'dockWindow'
  | 'resize'
  | 'pageLayout'
  | 'close';

export type StylebotEditorCommands = {
  [key in StylebotEditorCommandName]: string;
};
