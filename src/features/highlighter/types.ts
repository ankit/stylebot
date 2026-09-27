export type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type LayoutProperty =
  | 'margin'
  | 'border'
  | 'padding'
  | 'height'
  | 'width';

export type NextAncestorInfo = {
  label: string;
  styleCount: number;
};

export type TipPlacement = 'above' | 'below' | null;
