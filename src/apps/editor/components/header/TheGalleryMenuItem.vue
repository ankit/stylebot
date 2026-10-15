<template>
  <s-menu-item @click="openPublishing">
    <span class="menu-item-row">
      <span>{{ item.label }}</span>
      <span v-if="item.state" class="gallery-state">
        <s-status-dot :tone="item.changed ? 'warning' : 'success'" />
        <s-text as="span" size="caption" variant="muted">
          {{ item.state }}
        </s-text>
      </span>
    </span>
  </s-menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { SMenuItem, SStatusDot, SText } from '@stylebot/components';
import type { GalleryPublished } from '@stylebot/types';

/**
 * The ⋯ menu's way into publishing to the Gallery, with the published
 * style's state as a hint: its version, or that there are changes.
 */
export default Vue.extend({
  name: 'TheGalleryMenuItem',

  components: {
    SMenuItem,
    SStatusDot,
    SText,
  },

  computed: {
    item(): { label: string; state: string; changed: boolean } {
      const published: GalleryPublished | null =
        this.$store.state.publishedGalleryStyle;

      if (!published) {
        return {
          label: this.t('publish_to_gallery'),
          state: '',
          changed: false,
        };
      }

      if (this.$store.getters.hasUnpublishedChanges) {
        return {
          label: this.t('publish_update'),
          state: this.t('changes'),
          changed: true,
        };
      }

      return {
        label: this.t('manage_publishing'),
        // A version label, the same in every language.
        state: `v${published.version}`,
        changed: false,
      };
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

.gallery-state {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
