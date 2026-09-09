<template>
  <div class="card">
    <toggle-switch bare size="lg" :value="contextMenu" @change="contextMenu = $event" />

    <div class="text">
      <heading as="h2" size="sm">{{ t('right_click_menu') }}</heading>
      <text-block size="caption" class="description">{{ t('right_click_menu_description') }}</text-block>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ToggleSwitch, Heading, TextBlock } from '@stylebot/components';

export default Vue.extend({
  name: 'TheContextMenu',

  components: {
    ToggleSwitch,
    Heading,
    TextBlock,
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
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
}

.text {
  flex: 1;
  min-width: 0;
}

.description {
  margin-top: 2px;
}
</style>
