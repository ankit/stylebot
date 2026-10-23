<template>
  <s-menu-item :disabled="publishing" @click="openPublishing">
    <span class="menu-item-row">
      <span>{{ t(item.label) }}</span>
      <s-status-dot v-if="item.changed" tone="warning" :size="8" />
    </span>
  </s-menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { SMenuItem, SStatusDot } from '@stylebot/components';
import { getGalleryMenuItem } from '@stylebot/gallery';
import type { GalleryMenuItem } from '@stylebot/gallery';

/**
 * The ⋯ menu's Gallery item: publishes the profile, or links to its Gallery
 * page or the gallery site's form for editing it.
 */
export default Vue.extend({
  name: 'TheGalleryMenuItem',

  components: {
    SMenuItem,
    SStatusDot,
  },

  computed: {
    publishing(): boolean {
      return this.$store.state.publishing;
    },

    item(): GalleryMenuItem {
      const { publishedGalleryStyle, installedGalleryStyle, css } =
        this.$store.state;

      return getGalleryMenuItem(
        { published: publishedGalleryStyle, installed: installedGalleryStyle },
        css
      );
    },
  },

  methods: {
    openPublishing(): void {
      if (this.item.url) {
        window.open(this.item.url, '_blank', 'noopener');
      } else {
        this.$store.dispatch('publishToGallery');
      }

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
