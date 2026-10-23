<template>
  <s-menu-item v-if="item.label === 'view_in_gallery'" @click="openPublishing">
    <span class="menu-item-row">
      <span>{{ t(item.label) }}</span>
      <s-status-dot v-if="item.changed" tone="warning" :size="8" />
    </span>
  </s-menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { SMenuItem, SStatusDot } from '@stylebot/components';
import { getGalleryMenuItem, getGalleryStyleUrl } from '@stylebot/gallery';
import type { GalleryMenuItem } from '@stylebot/gallery';

/**
 * The ⋯ menu's link to a profile's page in the Gallery, for one installed
 * from it.
 */
export default Vue.extend({
  name: 'TheGalleryMenuItem',

  components: {
    SMenuItem,
    SStatusDot,
  },

  computed: {
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
      const { publishedGalleryStyle, installedGalleryStyle } =
        this.$store.state;

      if (!publishedGalleryStyle && installedGalleryStyle) {
        window.open(
          getGalleryStyleUrl(installedGalleryStyle),
          '_blank',
          'noopener'
        );
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
