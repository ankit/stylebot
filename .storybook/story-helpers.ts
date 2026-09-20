import type Vue from 'vue';
import type { Component } from 'vue';
import type { Store } from 'vuex';
import type { StoryObj } from '@storybook/vue';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import { getDeclarationsForSelector } from '@stylebot/css';
import type { State } from '../src/editor/store';

type Components = Record<string, Component>;
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

type Canvas = ReturnType<typeof within>;

/**
 * The seeded editor store, read off the Vue instance mounted on the app
 * root — which stays mounted after the panel closes.
 */
export const storeOf = (root: HTMLElement): Store<State> =>
  (root.querySelector('.stylebot-app') as HTMLElement & { __vue__: Vue })
    .__vue__.$store;

/**
 * Presses an editor shortcut. user-event types into the active element,
 * which the editor's document-level handler ignores when it's a text
 * field — blur first if a test just typed into one.
 */
export const pressKey = async (key: string): Promise<void> => {
  await userEvent.keyboard(key.length === 1 ? key : `{${key}}`);
};

export const blurActive = (): void =>
  (document.activeElement as HTMLElement | null)?.blur();

/**
 * Resolves with the open menu once AnchoredMenu has positioned it — it
 * renders hidden for a tick first, so presence alone isn't enough.
 */
export const findOpenMenu = async (canvas: Canvas): Promise<HTMLElement> => {
  const menu = await canvas.findByRole('menu');
  await waitFor(() => expect(menu).toBeVisible());
  return menu;
};

/**
 * Opens one of the header's window-action menus by its accessible name
 * and resolves with the menu once it's shown.
 */
export const openEditorMenu = async (
  canvas: Canvas,
  name: string
): Promise<HTMLElement> => {
  await userEvent.click(canvas.getByRole('button', { name }));
  return findOpenMenu(canvas);
};

/**
 * The value a selector's rule sets for a property in the seeded style, or
 * undefined when the rule has no such declaration.
 */
export const declaration = (
  store: Store<State>,
  selector: string,
  property: string
): string | undefined =>
  getDeclarationsForSelector(store.state.css, selector)?.find(
    decl => decl.property === property
  )?.value;

/**
 * The control column of a basic-mode property row, found by its label.
 */
export const propertyControl = (canvas: Canvas, label: string): HTMLElement =>
  canvas
    .getByText(label, { selector: '.property-row-label' })
    .closest('.property-row')
    ?.querySelector('.property-row-control') as HTMLElement;

export const propertyCard = (canvas: Canvas, label: string): HTMLElement =>
  canvas
    .getByText(label, { selector: '.property-card-label' })
    .closest('.property-card') as HTMLElement;

/**
 * The switch of a Presets feature card, found by its heading.
 */
export const featureSwitch = (canvas: Canvas, label: string): HTMLElement =>
  canvas
    .getByRole('heading', { name: label })
    .closest('.feature-card')
    ?.querySelector('input[type="checkbox"]') as HTMLElement;

export const cardCollapse = (canvas: Canvas, label: string): HTMLElement =>
  propertyCard(canvas, label).querySelector(
    '.property-card-collapse'
  ) as HTMLElement;
