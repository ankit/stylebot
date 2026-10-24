<template>
  <s-menu-item v-if="unlisted" :disabled="publishing" @click="publish">
    {{ t('publish_to_gallery') }}
  </s-menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { SMenuItem } from '@stylebot/components';

/**
 * The ⋯ menu's Publish to Gallery, for a profile neither published from here
 * nor installed from the Gallery; the bar under the editor covers those.
 */
export default Vue.extend({
  name: 'TheGalleryMenuItem',

  components: {
    SMenuItem,
  },

  computed: {
    publishing(): boolean {
      return this.$store.state.publishing;
    },

    unlisted(): boolean {
      const { publishedGalleryStyle, installedGalleryStyle } =
        this.$store.state;

      return !publishedGalleryStyle && !installedGalleryStyle;
    },
  },

  methods: {
    publish(): void {
      this.$store.dispatch('publishToGallery');
      this.$emit('click');
    },
  },
});
</script>
