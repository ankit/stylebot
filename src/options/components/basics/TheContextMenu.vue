<template>
  <div class="card">
    <toggle-switch size="lg" :value="contextMenu" @change="contextMenu = $event">
      <heading as="h2" size="sm">{{ t('right_click_menu') }}</heading>
      <s-text size="caption" variant="muted" class="description">{{ t('right_click_menu_description') }}</s-text>
    </toggle-switch>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ToggleSwitch, Heading, SText } from '@stylebot/components';

export default Vue.extend({
  name: 'TheContextMenu',

  components: {
    ToggleSwitch,
    Heading,
    SText,
  },

  computed: {
    contextMenu: {
      get(): boolean {
        return this.$store.state.options['contextMenu'];
      },

      set(value: boolean): void {
        this.$store.dispatch('setOption', { name: 'contextMenu', value });
      },
    },
  },
});
</script>

<style lang="scss" scoped>
.card {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
}

.description {
  margin-top: 2px;
}
</style>
