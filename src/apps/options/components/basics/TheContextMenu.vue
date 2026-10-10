<template>
  <s-list-item padded>
    <template #title>
      <h2 class="heading">{{ t('right_click_menu') }}</h2>
    </template>
    <template #meta>
      <s-text variant="muted" as="span">
        {{ t('right_click_menu_description') }}
      </s-text>
    </template>

    <template #trailing>
      <s-toggle-switch
        size="lg"
        track-end
        :value="contextMenu"
        @change="contextMenu = $event"
      >
        <span class="visually-hidden">{{ t('right_click_menu') }}</span>
      </s-toggle-switch>
    </template>
  </s-list-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { SListItem, SToggleSwitch, SText } from '@stylebot/components';

export default Vue.extend({
  name: 'TheContextMenu',

  components: {
    SListItem,
    SToggleSwitch,
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
.heading {
  margin: 0;
  font: inherit;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
