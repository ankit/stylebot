import type { Wrapper } from '@vue/test-utils';
import { shallowMount } from '@vue/test-utils';

import SNumberField from './SNumberField.vue';

describe('SNumberField.vue', () => {
  let wrapper: Wrapper<Vue>;

  beforeEach(() => {
    jest.useFakeTimers();
    wrapper = shallowMount(SNumberField, { propsData: { value: '10' } });
  });

  afterEach(() => {
    wrapper.destroy();
    jest.useRealTimers();
  });

  const input = () => wrapper.find('.number-input');
  const emitted = () => (wrapper.emitted('input') ?? []).map(([v]) => v);

  it('emits typing once it pauses', async () => {
    await input().setValue('1');
    await input().setValue('12');
    expect(emitted()).toEqual([]);

    jest.runAllTimers();
    expect(emitted()).toEqual(['12']);
  });

  it('emits typing straight away on Enter', async () => {
    await input().setValue('12');
    await input().trigger('keydown', { key: 'Enter' });

    expect(emitted()).toEqual(['12']);
  });

  it('steps from the shown value while a held arrow key is throttled', async () => {
    for (let i = 0; i < 5; i++) {
      await input().trigger('keydown', { key: 'ArrowUp' });
    }
    expect(emitted()).toEqual(['11']);
    expect((input().element as HTMLInputElement).value).toBe('15');

    await input().trigger('keyup', { key: 'ArrowUp' });
    expect(emitted()).toEqual(['11', '15']);
  });
});
