<template>
  <s-list-item padded interactive @click="onRowClick">
    <template #title>
      <h3 class="heading">
        <label for="active-style-badge">
          {{ t('style_count_on_toolbar_icon') }}
        </label>
      </h3>
    </template>
    <template #meta>
      <s-text variant="muted" size="large" as="span">
        {{ t('style_count_on_toolbar_icon_description') }}
      </s-text>
    </template>

    <template #trailing>
      <s-toggle-switch
        ref="toggle"
        size="lg"
        track-end
        input-id="active-style-badge"
        :value="activeStyleBadge"
        @change="activeStyleBadge = $event"
      />
    </template>
  </s-list-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { SListItem, SToggleSwitch, SText } from '@stylebot/components';

export default Vue.extend({
  name: 'TheActiveStyleBadge',

  components: {
    SListItem,
    SToggleSwitch,
    SText,
  },

  computed: {
    activeStyleBadge: {
      get(): boolean {
        return this.$store.state.options['activeStyleBadge'];
      },

      set(value: boolean): void {
        this.$store.dispatch('setOption', { name: 'activeStyleBadge', value });
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
