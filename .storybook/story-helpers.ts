import type { StoryObj } from '@storybook/vue';

type Components = Record<string, unknown>;

/**
 * Builds a story from a template string plus the components it uses,
 * with optional data and play — the shape almost every story here takes.
 */
export const fromTemplate = (
  components: Components,
  template: string,
  extra: Partial<StoryObj> & { data?: () => Record<string, unknown> } = {}
): StoryObj => {
  const { data, ...rest } = extra;

  return {
    render: () => ({
      components,
      data: data ?? (() => ({})),
      template,
    }),
    ...rest,
  };
};

/**
 * Focuses the first matching element as if the user pressed Tab, which is
 * what STooltip listens for to show without its hover delay.
 */
export const focusViaTab = (root: HTMLElement, selector = 'button'): void => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
  root.querySelector<HTMLElement>(selector)?.focus();
};

export const nextFrame = (): Promise<void> =>
  new Promise(resolve => requestAnimationFrame(() => resolve()));
