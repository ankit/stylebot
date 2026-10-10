<template>
  <s-list-item padded interactive @click="onRowClick">
    <template #title>
      <h2 class="heading">
        <label for="context-menu">{{ t('right_click_menu') }}</label>
      </h2>
    </template>
    <template #meta>
      <s-text variant="muted" size="large" as="span">
        {{ t('right_click_menu_description') }}
      </s-text>
    </template>

    <template #trailing>
      <s-toggle-switch
        ref="toggle"
        size="lg"
        track-end
        input-id="context-menu"
        :value="contextMenu"
        @change="contextMenu = $event"
      />
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

  methods: {
    onRowClick(event: MouseEvent): void {
      // The switch and its heading label toggle on their own.
      if (!(event.target as Element).closest('label')) {
        (this.$refs.toggle as InstanceType<typeof SToggleSwitch>).toggle();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.heading {
  margin: 0;
  font: inherit;
}
</style>
