export type StylebotBackgroundPage = {
  cache: {
    styles: {
      get: () => {
        [url: string]: {
          _enabled: boolean;
          _rules: any;
        };
      };
    };
  };
};

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
};
