import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor } from '@storybook/test';

import SAutocomplete from './SAutocomplete.vue';
import { fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Primitives/Autocomplete',
  tags: ['test'],
  component: SAutocomplete,
};

export default meta;

export const RefitsWhenWidened: StoryObj = {
  ...fromTemplate(
    { SAutocomplete },
    `<div class="autocomplete-host" style="display: flex; width: 4px">
      <s-autocomplete value="" placeholder="Pick an element" mono :items="[]" />
    </div>`
  ),
  name: 'a field mounted while too narrow shrinks back to one line once it widens',
  play: async ({ canvasElement }) => {
    const host =
      canvasElement.querySelector<HTMLElement>('.autocomplete-host')!;
    const field = canvasElement.querySelector<HTMLElement>('textarea')!;

    await waitFor(() =>
      expect(field.getBoundingClientRect().height).toBeGreaterThan(60)
    );

    host.style.width = '260px';

    await waitFor(() =>
      expect(field.getBoundingClientRect().height).toBeLessThan(40)
    );
  },
};
