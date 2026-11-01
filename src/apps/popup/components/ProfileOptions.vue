<template>
  <div :class="{ 'profile-options': options.length }">
    <slot />

    <template v-for="option in options">
      <div v-if="isScheme(option)" :key="option.name" class="profile-option">
        <s-text as="span" class="profile-option-label">{{ t('mode') }}</s-text>
        <s-color-scheme-switch
          :value="option.value"
          @change="$emit('option', option.name, $event)"
        />
      </div>

      <s-toggle-switch
        v-else-if="option.declaration.type === 'checkbox'"
        :key="option.name"
        class="profile-option"
        track-end
        :value="option.value === '1'"
        @change="$emit('option', option.name, $event ? '1' : '0')"
      >
        <s-text as="span" class="profile-option-label">
          {{ option.declaration.label }}
        </s-text>
      </s-toggle-switch>

      <div
        v-else
        :key="option.name"
        class="profile-option"
        role="group"
        :aria-label="option.declaration.label"
      >
        <s-text as="span" class="profile-option-label" aria-hidden="true">
          {{ option.declaration.label }}
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
import {
  SColorSchemeSwitch,
  SMenuItem,
  SSelect,
  SText,
  SToggleSwitch,
} from '@stylebot/components';

import type { ProfileOption } from '../utils';

/**
 * A profile's row with the options its css declares beneath it, in one
 * block, so they read as the profile's own rather than Stylebot's. Emits
 * `option` with an option's name and its new value.
 */
export default Vue.extend({
  name: 'ProfileOptions',

  components: {
    SColorSchemeSwitch,
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
    // `@option scheme` has no label of its own, so it gets the Mode switch.
    isScheme({ name, declaration }: ProfileOption): boolean {
      return name === 'scheme' && declaration.label === undefined;
    },

    choiceLabel({ declaration }: ProfileOption, value: string): string {
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
  padding: 2px 5px 6px 10px;
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
