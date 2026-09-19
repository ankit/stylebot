import type { StoryObj } from '@storybook/vue';

type Components = Record<string, unknown>;
type Data = () => Record<string, unknown>;

/**
 * Builds a story from a template string plus the components it uses,
 * with optional data and play — the shape most stories here take.
 */
export const fromTemplate = (
  components: Components,
  template: string,
  extra: Partial<StoryObj> & { data?: Data } = {}
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
 * A story whose template is bound to every arg declared in the meta's
 * argTypes, so the Controls panel drives it live.
 */
export const playground = (
  components: Components,
  template: string,
  data?: Data
): StoryObj => ({
  render: (_args, { argTypes }) => ({
    components,
    props: Object.keys(argTypes),
    data: data ?? (() => ({})),
    template,
  }),
});

type MatrixRow = { label: string; attrs: string };
type MatrixColumn = { label: string; cell: (attrs: string) => string };

/**
 * Lays every row variant out against every column state in a labeled
 * grid, so all combinations of a primitive are visible at once.
 */
export const matrix = ({
  components,
  rows,
  columns,
  data,
}: {
  components: Components;
  rows: Array<MatrixRow>;
  columns: Array<MatrixColumn>;
  data?: Data;
}): StoryObj => {
  const header = columns
    .map(column => `<div class="sb-matrix-head">${column.label}</div>`)
    .join('');

  const body = rows
    .map(
      row =>
        `<div class="sb-matrix-label">${row.label}</div>` +
        columns
          .map(
            column =>
              `<div class="sb-matrix-cell">${column.cell(row.attrs)}</div>`
          )
          .join('')
    )
    .join('');

  return fromTemplate(
    components,
    `<div class="sb-matrix" style="--sb-columns: ${columns.length}">
      <div></div>${header}${body}
    </div>`,
    { data }
  );
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
