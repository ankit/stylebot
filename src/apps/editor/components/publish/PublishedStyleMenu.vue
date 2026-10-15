<template>
  <s-anchored-menu>
    <template #trigger="{ toggle }">
      <s-icon-button
        :size="28"
        :tooltip="t('more')"
        :disabled="disabled"
        @click="toggle"
      >
        <more-icon :size="15" />
      </s-icon-button>
    </template>

    <template #default="{ close }">
      <s-menu dense size="small" :min-width="210">
        <s-menu-item
          @click="
            viewInGallery();
            close();
          "
        >
          {{ t('view_in_gallery') }}
        </s-menu-item>
        <s-menu-divider />
        <s-menu-item
          danger
          @click="
            $emit('unpublish');
            close();
          "
        >
          {{ t('unpublish') }}
        </s-menu-item>
      </s-menu>
    </template>
  </s-anchored-menu>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import {
  SAnchoredMenu,
  SIconButton,
  SMenu,
  SMenuDivider,
  SMenuItem,
} from '@stylebot/components';
import { MoreIcon } from '@stylebot/icons';
import { getGalleryStyleUrl } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

/**
 * The ⋯ menu for a published style: open it in the Gallery, or emit
 * `unpublish` to take it down.
 */
export default Vue.extend({
  name: 'PublishedStyleMenu',

  components: {
    SAnchoredMenu,
    SIconButton,
    SMenu,
    SMenuDivider,
    SMenuItem,
    MoreIcon,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryStyle>,
      required: true,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    viewInGallery(): void {
      window.open(getGalleryStyleUrl(this.styleData), '_blank', 'noopener');
    },
  },
});
</script>
