<template>
  <div class="color-picker-tabs">
    <s-tabs :value="value" :tabs="tabs" @change="$emit('change', $event)" />
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { STabs } from '@stylebot/components';

export default Vue.extend({
  name: 'ColorPickerTabs',

  components: {
    STabs,
  },

  props: {
    value: {
      type: String as PropType<'already-used' | 'palette' | 'custom'>,
      required: true,
    },

    firstTabLabel: {
      type: String,
      required: true,
    },

    firstTabDisabled: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    tabs(): Array<{ value: string; label: string; disabled?: boolean }> {
      return [
        { value: 'already-used', label: this.firstTabLabel, disabled: this.firstTabDisabled },
        { value: 'palette', label: this.t('color_picker_tab_palette') },
        { value: 'custom', label: this.t('color_picker_tab_custom') },
      ];
    },
  },
});
</script>

<style lang="scss" scoped>
.color-picker-tabs ::v-deep .tabs {
  gap: 2px;
  padding: 10px 14px 0;
  border-bottom: none;
}

// Only re-skins the shape (equal-width pill tabs) — typography (size,
// weight, color per state) stays whatever STabs itself already defines.
.color-picker-tabs ::v-deep .tab {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  border-radius: 7px;
  box-shadow: none;

  &:hover:not(:disabled):not(.active) {
    background: var(--accent);
  }

  &.active {
    background: var(--accent);
    box-shadow: none;
  }
}
</style>
