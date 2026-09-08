/**
 * Existing stored values may not be one of these steps — snap to closest.
 */
export const nearestStepIndex = (steps: number[], value: number): number =>
  steps.reduce(
    (closest, step, i) =>
      Math.abs(step - value) < Math.abs(steps[closest] - value) ? i : closest,
    0
  );
