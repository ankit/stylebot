import { shallowMount } from '@vue/test-utils';

import FontSize from '../FontSize.vue';
import Length from '../../Length.vue';

describe('FontSize.vue', () => {
  it('should pass "font-size" as the "property" prop to Length', () => {
    const fontSizeWrapper = shallowMount(FontSize);
    const lengthWrapper = fontSizeWrapper.findComponent(Length);

    expect(lengthWrapper.props().property).toBe('font-size');
  });
});
