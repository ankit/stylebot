<template>
  <s-tooltip :text="tooltip" class="other-rule-hint">
    <button
      type="button"
      class="other-rule-button"
      :class="{ overrides }"
      :aria-label="tooltip"
      @click="open"
    >
      <alert-triangle-icon v-if="overrides" :size="14" />
      <arrow-up-right-icon v-else :size="12" />
    </button>

    <template #text>
      <s-code-text :text="tooltip" :code="selector" />
    </template>
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import { SCodeText, STooltip } from '@stylebot/components';
import { AlertTriangleIcon, ArrowUpRightIcon } from '@stylebot/icons';

/**
 * Sits beside the label of a control whose value comes from another of the user's
 * selectors, naming it and switching the editor to it. With `overrides`,
 * that selector wins over a value the active rule sets too: on every element
 * the active rule reaches, or only the inspected one without `everywhere`.
 */
export default Vue.extend({
  name: 'OtherRuleHint',

  components: {
    AlertTriangleIcon,
    ArrowUpRightIcon,
    SCodeText,
    STooltip,
  },

  props: {
    selector: {
      type: String,
      required: true,
    },

    overrides: {
      type: Boolean,
      default: false,
    },

    // Whether the selector overrides on every element the active one matches.
    everywhere: {
      type: Boolean,
      default: true,
    },
  },

  computed: {
    tooltip(): string {
      if (!this.overrides) {
        return this.t('styled_by_selector', [this.selector]);
      }

      return this.t(
        this.everywhere
          ? 'overridden_by_selector'
          : 'overridden_by_selector_on_this_element',
        [this.selector]
      );
    },
  },

  methods: {
    open(): void {
      this.$store.commit('setActiveSelector', this.selector);
    },
  },
});
</script>

<style lang="scss" scoped>
.other-rule-hint {
  flex: none;
}

.other-rule-button {
  @include button-reset;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  outline: none;
  color: var(--accent-text);
  cursor: pointer;

  &.overrides {
    color: var(--warning-icon);
  }

  &:hover {
    background: var(--field-surface-hover);
  }

  @include focus-ring;
}
</style>
