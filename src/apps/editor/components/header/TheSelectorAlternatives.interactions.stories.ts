import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor } from '@storybook/test';

import TheSelectorAlternatives from './TheSelectorAlternatives.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';
import { storeOf, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Selector alternatives',
  tags: ['test'],
  component: TheSelectorAlternatives,
  parameters: { padded: false },
};

export default meta;

const chipTexts = (root: HTMLElement) =>
  Array.from(
    root.querySelectorAll('.selector-alternatives > .selector-alternative'),
    chip => chip.textContent?.trim()
  );

export const SwitchBetweenAlternatives: StoryObj = {
  ...editor({
    ...WITH_RULE,
    activeSelector: 'h1',
    selectorAlternatives: {
      existing: ['.sb-page h1'],
      candidates: ['h1', 'div h1', 'body div h1', '#t'],
    },
  }),
  name: 'a pick offers other selectors for the element under the field',
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);

    // The style's selectors first, then as many as fit, then the rest
    // behind "+N".
    const all = ['.sb-page h1', 'div h1', 'body div h1', '#t'];
    await waitFor(() =>
      expect(chipTexts(canvasElement)[0]).toBe('.sb-page h1')
    );
    const texts = chipTexts(canvasElement);
    const more = texts.at(-1)?.match(/^\+(\d+) more$/);
    const shown = more ? texts.slice(0, -1) : texts;
    await expect(shown).toEqual(all.slice(0, shown.length));
    await expect(shown.length + Number(more?.[1] ?? 0)).toBe(all.length);

    const chip = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.selector-alternative')
    ).find(el => el.textContent?.trim() === 'div h1') as HTMLElement;
    await user.click(chip);
    await expect(store.state.activeSelector).toBe('div h1');

    // Still offered while the active selector is one of them.
    await waitFor(() => expect(chipTexts(canvasElement)).toContain('h1'));

    // Choosing something unrelated hides them.
    store.commit('setActiveSelector', 'p');
    await waitFor(() => expect(chipTexts(canvasElement)).toEqual([]));
  },
};
