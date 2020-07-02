export type StylebotEditingMode = 'Basic' | 'Advanced' | 'Edit CSS';
export type StylebotShortcutMetaKey = 'ctrl' | 'shift' | 'alt' | 'none';

export type StylebotOptions = {
  contextMenu: boolean;
  mode: StylebotEditingMode;
  useShortcutKey: boolean;
  shortcutKey: number;
  shortcutMetaKey: StylebotShortcutMetaKey;
};

export type StylebotPlacement = 'left' | 'right';

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
};

export type StylebotBackgroundPage = {
  cache: {
    options: StylebotOptions;

    styles: {
      get: () => {
        [url: string]: {
          enabled: boolean;
          css: string;
        };
      };

      create: (url: string, rules: any) => void;
      delete: (url: string) => void;
      toggle: (url: string, enabled: boolean, _: any) => void;
      toggleAll: (enabled: boolean) => void;
      deleteAll: () => void;
      import: (styles: any) => void;
    };
  };

  saveOption: (name: string, value: string | boolean | number) => void;
};
