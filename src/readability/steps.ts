// Discrete size/width steps for the reader's segmented +/- controls.
// 17 is the default; two steps sit below it so "smaller" isn't disabled.
export const SIZES = [15, 16, 17, 18, 19, 21, 23, 25];

// In em (not the design's raw px) so the column keeps scaling with font size,
// matching the reader's existing max-width:${width}em convention.
export const WIDTHS = [32, 36, 40, 44, 48];

// Existing stored values may not be one of these steps — snap to closest.
export const nearestStepIndex = (steps: number[], value: number): number =>
  steps.reduce(
    (closest, step, i) =>
      Math.abs(step - value) < Math.abs(steps[closest] - value) ? i : closest,
    0
  );
