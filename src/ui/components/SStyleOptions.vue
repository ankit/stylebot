<template>
  <div class="style-options">
    <template v-for="option in options">
      <s-toggle-switch
        v-if="option.declaration.type === 'checkbox'"
        :key="option.name"
        class="style-option"
        track-end
        :value="option.value === '1'"
        @change="$emit('option', option.name, $event ? '1' : '0')"
      >
        <s-text as="span" class="style-option-label">
          {{ optionLabel(option) }}
        </s-text>
      </s-toggle-switch>

      <div
        v-else
        :key="option.name"
        class="style-option style-option--select"
        role="group"
        :aria-label="optionLabel(option)"
      >
        <s-text as="span" class="style-option-label" aria-hidden="true">
          {{ optionLabel(option) }}
        </s-text>
        <s-select
          class="style-option-select"
          menu-size="small"
          :text="choiceLabel(option, option.value)"
          :menu-min-width="140"
        >
          <template #default="{ close }">
            <s-menu-item
              v-for="value in option.declaration.values"
              :key="value"
              :selected="value === option.value"
              @click="
                $emit('option', option.name, value);
                close();
              "
            >
              <span class="style-option-choice">
                {{ choiceLabel(option, value) }}
              </span>
            </s-menu-item>
          </template>
        </s-select>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { StyleOption } from '@stylebot/types';

import SMenuItem from './SMenuItem.vue';
import SSelect from './SSelect.vue';
import SText from './SText.vue';
import SToggleSwitch from './SToggleSwitch.vue';

/**
 * A row for each option a style declares: a switch for a checkbox and a
 * dropdown for a select, under the author's labels. Emits `option` with an
 * option's name and its new value.
 */
export default Vue.extend({
  name: 'SStyleOptions',

  components: {
    SMenuItem,
    SSelect,
    SText,
    SToggleSwitch,
  },

  props: {
    options: {
      type: Array as PropType<Array<StyleOption>>,
      required: true,
    },
  },

  methods: {
    // `@option scheme` has no label of its own, so it's named Mode.
    isScheme({ name, declaration }: StyleOption): boolean {
      return name === 'scheme' && declaration.label === undefined;
    },

    optionLabel(option: StyleOption): string {
      return this.isScheme(option)
        ? this.t('mode')
        : option.declaration.label ?? option.name;
    },

    choiceLabel(option: StyleOption, value: string): string {
      const { declaration } = option;

      if (this.isScheme(option)) {
        return this.t(`appearance_${value}`);
      }

      return declaration.type === 'select'
        ? declaration.choices?.[value]?.label ?? value
        : value;
    },
  },
});
</script>

<style lang="scss" scoped>
.style-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
  height: 32px;
  padding: 0 10px;
}

.style-option-label {
  @include truncate;

  min-width: 0;
  color: var(--text-secondary);
}

.style-option-choice {
  @include truncate;

  display: block;
  max-width: 240px;
}

.style-option-select {
  flex-shrink: 0;
  max-width: 60%;
}
</style>
