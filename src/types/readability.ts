export type ReadabilityArticle = {
  title: string;
  byline: string;
  content: string;
  siteName: string;
  published: string;
};

export type ReadabilityTheme = 'light' | 'dark' | 'sepia';
export type ReadabilitySettings = {
  font: string;
  size: number;
  width: number;
  lineHeight: number;
  theme: ReadabilityTheme;
  justify: boolean;
};
