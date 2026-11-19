export const TEXT_PROPERTIES = [
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'text-decoration',
  'text-align',
];

export const COLOR_PROPERTIES = ['color', 'background-color'];

export const LAYOUT_PROPERTIES = [
  'width',
  'height',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
];

export const BORDER_PROPERTIES = [
  'border',
  'border-style',
  'border-width',
  'border-color',
  ...['top', 'right', 'bottom', 'left'].flatMap(side => [
    `border-${side}`,
    `border-${side}-style`,
    `border-${side}-width`,
    `border-${side}-color`,
  ]),
  'border-radius',
];

export const EFFECTS_PROPERTIES = ['opacity', 'filter'];

// Toggled via the Hide/Reset action toolbar, not a property panel.
const OTHER_KNOWN_PROPERTIES = ['display'];

export const KNOWN_PROPERTIES = [
  ...TEXT_PROPERTIES,
  ...COLOR_PROPERTIES,
  ...LAYOUT_PROPERTIES,
  ...BORDER_PROPERTIES,
  ...EFFECTS_PROPERTIES,
  ...OTHER_KNOWN_PROPERTIES,
];
