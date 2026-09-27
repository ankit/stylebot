<template>
  <div class="card">
    <s-toggle-switch
      size="lg"
      :value="contextMenu"
      @change="contextMenu = $event"
    >
      <s-heading as="h2" size="md">{{ t('right_click_menu') }}</s-heading>
      <s-text variant="muted" class="description">
        {{ t('right_click_menu_description') }}
      </s-text>
    </s-toggle-switch>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SToggleSwitch, SHeading, SText } from '@stylebot/components';

export default Vue.extend({
  name: 'TheContextMenu',

  components: {
    SToggleSwitch,
    SHeading,
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
  border: 1px solid var(--panel-border);
  border-radius: 10px;
}

.description {
  margin-top: 2px;
}
</style>
