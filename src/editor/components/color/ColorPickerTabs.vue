<template>
  <div class="color-picker-tabs">
    <s-tabs :value="value" :tabs="tabs" @change="$emit('change', $event)" />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
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
        {
          value: 'already-used',
          label: this.firstTabLabel,
          disabled: this.firstTabDisabled,
        },
        { value: 'palette', label: this.t('color_picker_tab_palette') },
        { value: 'custom', label: this.t('color_picker_tab_custom') },
      ];
    },
  },
});
</script>

<style lang="scss" scoped>
// Reuse STabs' own sliding-underline look as-is; only the horizontal inset needs adjusting.
.color-picker-tabs ::v-deep .tabs {
  padding: 10px 14px 0;
}
</style>
