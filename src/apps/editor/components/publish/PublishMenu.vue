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
          v-if="styleData"
          @click="
            viewInGallery();
            close();
          "
        >
          {{ t('view_in_gallery') }}
        </s-menu-item>
        <s-menu-item
          @click="
            $emit('sign-out');
            close();
          "
        >
          {{ t('sign_out') }}
        </s-menu-item>
        <template v-if="styleData">
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
        </template>
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
 * The publish view's ⋯ menu while signed in: emits `sign-out`, and for a
 * published style also opens it in the Gallery or emits `unpublish`.
 */
export default Vue.extend({
  name: 'PublishMenu',

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
      type: Object as PropType<GalleryStyle | null>,
      default: null,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    viewInGallery(): void {
      if (this.styleData) {
        window.open(getGalleryStyleUrl(this.styleData), '_blank', 'noopener');
      }
    },
  },
});
</script>
