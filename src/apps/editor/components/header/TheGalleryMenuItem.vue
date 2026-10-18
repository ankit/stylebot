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
import { getGalleryStyleUrl } from '@stylebot/gallery';

type Item = { label: string; changed: boolean };

/**
 * The ⋯ menu's way into publishing to the Gallery, with an amber dot when a
 * published style has changes to publish. A profile installed from the
 * Gallery links to its page there instead.
 */
export default Vue.extend({
  name: 'TheGalleryMenuItem',

  components: {
    SMenuItem,
    SStatusDot,
  },

  computed: {
    item(): Item {
      const { publishedGalleryStyle, installedGalleryStyle } =
        this.$store.state;

      if (!publishedGalleryStyle && installedGalleryStyle) {
        return { label: this.t('view_in_gallery'), changed: false };
      }

      if (!publishedGalleryStyle) {
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
      const { publishedGalleryStyle, installedGalleryStyle } =
        this.$store.state;

      if (!publishedGalleryStyle && installedGalleryStyle) {
        window.open(
          getGalleryStyleUrl(installedGalleryStyle),
          '_blank',
          'noopener'
        );
      } else {
        this.$store.commit('setPublishing', true);
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
