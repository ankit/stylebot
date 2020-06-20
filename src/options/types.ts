export type StylebotBackgroundPage = {
  cache: {
    options: any;
    styles: {
      get: () => {
        [url: string]: {
          _enabled: boolean;
          _rules: any;
        };
      };

      create: (url: string, rules: any) => void;
      delete: (url: string) => void;
      toggle: (url: string, enabled: boolean, _: any) => void;
      toggleAll: (enabled: boolean) => void;
      deleteAll: () => void;
    };
  };

  saveOption: (name: string, value: string | boolean) => void;
};

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
};

export type StylebotEditingMode = 'Basic' | 'Advanced' | 'Edit CSS';
export type StylebotShortcutMetaKey = 'ctrl' | 'shift' | 'alt' | 'none';

export type StylebotOptions = {
  contextMenu: boolean;
  mode: StylebotEditingMode;
  useShortcutKey: boolean;
  shortcutKey: number;
  shortcutMetaKey: StylebotShortcutMetaKey;
};
