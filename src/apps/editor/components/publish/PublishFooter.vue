<template>
  <div class="footer">
    <s-button
      variant="primary"
      size="large"
      :disabled="!canPublish"
      :title="target && !hasChanges ? t('no_changes_to_publish') : ''"
      @click="$emit('publish')"
    >
      <s-spinner v-if="publishing" />
      {{ label }}
    </s-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SButton, SSpinner } from '@stylebot/components';
import type { GalleryStyle } from '@stylebot/types';

/**
 * The publish form's footer: the button that emits `publish`, which saves
 * an update that makes no new version.
 */
export default Vue.extend({
  name: 'PublishFooter',

  components: {
    SButton,
    SSpinner,
  },

  props: {
    // The Gallery style this publishes a new version of, if any.
    target: {
      type: Object as PropType<GalleryStyle | null>,
      default: null,
    },

    publishing: {
      type: Boolean,
      default: false,
    },

    canPublish: {
      type: Boolean,
      default: false,
    },

    hasChanges: {
      type: Boolean,
      default: false,
    },

    // An update with new CSS, rather than only new details.
    newVersion: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    label(): string {
      if (this.target && !this.newVersion) {
        return this.t(this.publishing ? 'saving' : 'save');
      }

      return this.t(this.publishing ? 'publishing' : 'publish');
    },
  },
});
</script>

<style lang="scss" scoped>
.footer {
  flex: none;
  display: flex;
  flex-direction: column;
  padding: 14px;
  border-top: 1px solid var(--panel-border);
}
</style>
