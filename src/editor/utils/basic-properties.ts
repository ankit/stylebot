export const TEXT_PROPERTIES = [
  'font-family',
  'font-size',
  'line-height',
  'color',
  'text-decoration',
  'text-align',
];

export const COLOR_PROPERTIES = ['background-color'];

export const LAYOUT_PROPERTIES = [
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-style',
  'border-width',
  'border-color',
];

export const EFFECTS_PROPERTIES = ['opacity', 'filter'];

// Toggled via the Hide/Reset action toolbar, not a property panel.
const OTHER_KNOWN_PROPERTIES = ['display'];

export const KNOWN_PROPERTIES = [
  ...TEXT_PROPERTIES,
  ...COLOR_PROPERTIES,
  ...LAYOUT_PROPERTIES,
  ...EFFECTS_PROPERTIES,
  ...OTHER_KNOWN_PROPERTIES,
];
