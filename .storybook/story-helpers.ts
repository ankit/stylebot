import type Vue from 'vue';
import type { Component } from 'vue';
import type { Store } from 'vuex';
import type { StoryObj } from '@storybook/vue';
import { expect, fireEvent, userEvent, waitFor, within } from '@storybook/test';

import { getDeclarationsForSelector } from '@stylebot/css';
import type { State } from '@/editor/store';

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

export type Canvas = ReturnType<typeof within>;

/* The user-event instance every interaction test drives; the preview
   decorator rebuilds it with a delay when the toolbar asks for slow
   motion, so a play can be watched at human speed. */
export let user = userEvent.setup();

export const setInteractionDelay = (ms: number): void => {
  user = userEvent.setup({ delay: ms });
};

/**
 * The seeded editor store, read off the Vue instance mounted on the app
 * root — which stays mounted after the panel closes.
 */
export const storeOf = (root: HTMLElement): Store<State> =>
  (root.querySelector('.stylebot-app') as HTMLElement & { __vue__: Vue })
    .__vue__.$store;

/**
 * Presses a key by name. user-event types into the active element, which
 * the editor's shortcut handler ignores when it's a text field.
 */
export const pressKey = async (key: string): Promise<void> => {
  await user.keyboard(`{${key}}`);
};

let hoverSettled = false;

export const resetHoverSettled = (): void => {
  hoverSettled = false;
};

/**
 * Waits for the browser to decide what the real cursor rests on. Headless
 * Chromium on Linux keeps the never-moved cursor at the origin and
 * re-evaluates it after the next layout change, firing pointerover on
 * whatever sits there — which would displace a hover the test had just
 * dispatched. Bounded, because on macOS the cursor counts as outside the
 * window and nothing ever matches :hover.
 */
const settleHover = async (): Promise<void> => {
  if (hoverSettled) {
    return;
  }

  const deadline = Date.now() + 500;
  while (
    Date.now() < deadline &&
    !document.querySelector('#storybook-root :hover')
  ) {
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
  }

  hoverSettled = true;
};

/**
 * Hovers a page element while inspecting, once the browser's own hover
 * state can no longer interfere.
 */
export const hoverPage = async (element: HTMLElement): Promise<void> => {
  await settleHover();
  await user.hover(element);
};

/**
 * Picks a page element the way the inspector does: hover it, then Enter.
 */
export const pick = async (element: HTMLElement): Promise<void> => {
  await hoverPage(element);
  await pressKey('Enter');
};

/**
 * Sets a range input the way a drag would end up, since user-event can't
 * drag a slider.
 */
export const setRange = async (
  input: HTMLInputElement,
  value: number
): Promise<void> => {
  input.value = String(value);
  await fireEvent.input(input);
};

export const numberInput = (control: HTMLElement): HTMLInputElement =>
  control.querySelector('.number-input') as HTMLInputElement;

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
  await user.click(canvas.getByRole('button', { name }));
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
 * A computed style on the stand-in page, for asserting that the CSS the
 * editor wrote is what the browser applies.
 */
export const pageStyle = (
  root: HTMLElement,
  selector: string,
  property: string
): string =>
  getComputedStyle(
    root.querySelector(`.sb-page ${selector}`) as Element
  ).getPropertyValue(property);

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

export const cardHeader = (canvas: Canvas, label: string): HTMLElement =>
  propertyCard(canvas, label).querySelector(
    '.property-card-header'
  ) as HTMLElement;

export const cardCollapse = (canvas: Canvas, label: string): HTMLElement =>
  propertyCard(canvas, label).querySelector(
    '.property-card-collapse'
  ) as HTMLElement;

/**
 * Collapses every open property card through its header, as a user
 * would, and waits until none is left open.
 */
export const collapseAllCards = async (root: HTMLElement): Promise<void> => {
  for (const card of root.querySelectorAll('.property-card')) {
    if (!card.querySelector('.property-card-collapse.collapsed')) {
      await user.click(
        card.querySelector('.property-card-header') as HTMLElement
      );
    }
  }

  await waitFor(() =>
    expect(
      root.querySelectorAll('.property-card-collapse:not(.collapsed)')
    ).toHaveLength(0)
  );
};
