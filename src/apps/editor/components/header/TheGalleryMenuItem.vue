<template>
  <s-menu-item @click="openPublishing">
    <span class="menu-item-row">
      <span>{{ item.label }}</span>
      <s-status-dot v-if="item.changed" tone="warning" :size="8" />
    </span>
  </s-menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { SMenuItem, SStatusDot } from '@stylebot/components';

type Item = { label: string; changed: boolean };

/**
 * The ⋯ menu's way into publishing to the Gallery, with an amber dot when a
 * published style has changes to publish.
 */
export default Vue.extend({
  name: 'TheGalleryMenuItem',

  components: {
    SMenuItem,
    SStatusDot,
  },

  computed: {
    item(): Item {
      if (!this.$store.state.publishedGalleryStyle) {
        return { label: this.t('publish_to_gallery'), changed: false };
      }

      if (this.$store.getters.hasUnpublishedChanges) {
        return { label: this.t('publish_update'), changed: true };
      }

      return { label: this.t('manage_publishing'), changed: false };
    },
  },

  methods: {
    openPublishing(): void {
      this.$store.commit('setPublishing', true);
      this.$emit('click');
    },
  },
});
</script>

<style lang="scss" scoped>
.menu-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}
</style>
