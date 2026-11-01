<template>
  <div :class="{ 'profile-options': options.length }">
    <slot />

    <template v-for="option in options">
      <s-toggle-switch
        v-if="option.declaration.type === 'checkbox'"
        :key="option.name"
        class="profile-option"
        track-end
        :value="option.value === '1'"
        @change="$emit('option', option.name, $event ? '1' : '0')"
      >
        <s-text as="span" class="profile-option-label">
          {{ optionLabel(option) }}
        </s-text>
      </s-toggle-switch>

      <div
        v-else
        :key="option.name"
        class="profile-option"
        role="group"
        :aria-label="optionLabel(option)"
      >
        <s-text as="span" class="profile-option-label" aria-hidden="true">
          {{ optionLabel(option) }}
        </s-text>
        <s-select
          class="profile-option-select"
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
              {{ choiceLabel(option, value) }}
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
import { SMenuItem, SSelect, SText, SToggleSwitch } from '@stylebot/components';

import type { ProfileOption } from '../utils';

/**
 * A profile's row with the options its css declares beneath it, in one
 * block, so they read as the profile's own rather than Stylebot's. Emits
 * `option` with an option's name and its new value.
 */
export default Vue.extend({
  name: 'ProfileOptions',

  components: {
    SMenuItem,
    SSelect,
    SText,
    SToggleSwitch,
  },

  props: {
    // The options in effect, when the profile is applied and declares any.
    options: {
      type: Array as PropType<Array<ProfileOption>>,
      default: () => [],
    },
  },

  methods: {
    // `@option scheme` has no label of its own, so it's named Mode.
    isScheme({ name, declaration }: ProfileOption): boolean {
      return name === 'scheme' && declaration.label === undefined;
    },

    optionLabel(option: ProfileOption): string {
      return this.isScheme(option)
        ? this.t('mode')
        : option.declaration.label ?? option.name;
    },

    choiceLabel(option: ProfileOption, value: string): string {
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
.profile-options {
  box-shadow: inset 0 0 0 1px var(--panel-border);
  border-radius: 8px;
}

.profile-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 32px;
  padding: 0 5px 0 10px;

  &:last-child {
    margin-bottom: 4px;
  }
}

.profile-option-label {
  @include truncate;

  min-width: 0;
  color: var(--text-secondary);
}

.profile-option-select {
  flex-shrink: 0;
  max-width: 60%;
}
</style>
