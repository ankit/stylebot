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

export type TipPlacement = 'above' | 'below' | null;
