export type StylebotBackgroundPage = {
  cache: {
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
    };
  };
};

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
};
