export type ColorRamp = {
  label: string;
  colors: Array<string>;
};

// Two ramps, warm and cool, eight steps each from paper to ink — the set
// that opens when nothing is remembered.
export const neutralRamps: Array<ColorRamp> = [
  {
    label: 'Warm',
    colors: [
      '#ffffff',
      '#f7f5f2',
      '#eae7e1',
      '#d6d1c8',
      '#b3aca0',
      '#7d7669',
      '#4b463d',
      '#221f1a',
    ],
  },
  {
    label: 'Cool',
    colors: [
      '#ffffff',
      '#f5f7fa',
      '#e6eaf0',
      '#d2d8e2',
      '#a7b0be',
      '#6f7987',
      '#414a56',
      '#171b21',
    ],
  },
];

// Eight hues by five lightnesses. Hue is held per column (red, orange,
// yellow, green, teal, blue, violet, pink), lightness per row, row 1
// lightest to row 5 darkest.
export const hueGrid: Array<Array<string>> = [
  ['#fde8e6', '#fdeade', '#fcf3d9', '#e3f2de', '#dcf0ee', '#deeafa', '#e7e3f7', '#f9e2ef'],
  ['#f6b4ad', '#f7bd93', '#f2dc90', '#aed9a4', '#9fd6d0', '#a6c6f0', '#b9afe4', '#eeadd1'],
  ['#e4685e', '#e5813f', '#d9b53c', '#5fa952', '#4aa49c', '#4b87d8', '#7a6bc9', '#d267a4'],
  ['#a83b34', '#a85722', '#9c7d1c', '#3d7434', '#2c7069', '#2c5b98', '#50438f', '#93416f'],
  ['#5c1f1b', '#5c2f13', '#54430f', '#213f1c', '#173c38', '#173152', '#2b244e', '#50233c'],
];

// Single ramp, light to dark: backgrounds, then text.
export const readingRow: Array<string> = [
  '#fffdf7',
  '#fdf6e3',
  '#f4ecd8',
  '#eae0c8',
  '#8a7a63',
  '#5b4636',
  '#3b332a',
  '#1b1714',
];

// The one set that reverses direction — dark to light — since its first
// steps are page/card/raised surfaces and its last are muted/secondary/
// primary text.
export const darkModeRow: Array<string> = [
  '#0b0d10',
  '#14171c',
  '#1c2026',
  '#272c34',
  '#3a4150',
  '#6b7480',
  '#9aa3af',
  '#c8ced6',
];
