<template>
  <s-segmented-control
    class="value-group"
    fit
    :value="value"
    :placeholder="placeholder"
    :options="options"
    :disabled="disabled"
    @change="select"
  >
    <template #option="{ option }">
      <component :is="option.icon" v-if="option.icon" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-else v-html="option.html" />
    </template>
  </s-segmented-control>
</template>

<script lang="ts">
import type { PropType, Component } from 'vue';
import Vue from 'vue';
import { SSegmentedControl } from '@stylebot/components';
import { getDeclarationValue } from '@stylebot/css';

import { computedKeywordPlaceholder } from '../utils/computed-placeholder';

type Option = { title: string; value: string; html?: string; icon?: Component };

export default Vue.extend({
  name: 'CssPropertyValueGroup',

  components: {
    SSegmentedControl,
  },

  props: {
    property: {
      type: String,
      required: true,
    },

    options: {
      type: Array as PropType<Array<Option>>,
      required: true,
    },
  },

  computed: {
    value(): string {
      return getDeclarationValue(this.$store.getters.activeRule, this.property);
    },

    placeholder(): string {
      return computedKeywordPlaceholder(
        this.$store.state.computedStyles,
        this.property
      );
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    select(value: string): void {
      // Clicking the active option clears the declaration.
      this.$store.dispatch('applyDeclaration', {
        property: this.property,
        value: value === this.value ? '' : value,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.value-group ::v-deep .segment {
  min-width: 27px;
  padding: 5px 6px;
}
</style>
