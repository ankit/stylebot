<template>
  <s-list-item
    :interactive="editingEnabled"
    :muted="!enabled"
    v-bind="linkAttrs"
    v-on="linkListeners"
  >
    <template #icon><site-icon :urls="[url]" /></template>
    <template #title>{{ url }}</template>
    <template #meta>
      <s-text as="span" variant="muted" class="meta">{{ meta }}</s-text>
    </template>

    <template #trailing>
      <span class="control" @click.stop>
        <s-toggle-switch :value="enabled" @change="$emit('toggle')">
          <span class="toggle-label">{{ url }}</span>
        </s-toggle-switch>
      </span>

      <span class="control" @click.stop>
        <style-row-menu
          :url="url"
          :size="28"
          v-on="editListeners"
          @open-site="openSite"
          @delete="showDeleteConfirm = true"
        />
      </span>

      <span v-if="showDeleteConfirm" @click.stop>
        <s-confirm-dialog
          :title="t('delete_styles_for_url', [url])"
          :message="t('delete_style_warning')"
          :confirm-label="t('delete')"
          @cancel="showDeleteConfirm = false"
          @confirm="
            showDeleteConfirm = false;
            $emit('delete');
          "
        />
      </span>
    </template>
  </s-list-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

import {
  SConfirmDialog,
  SListItem,
  SText,
  SToggleSwitch,
} from '@stylebot/components';

import SiteIcon from '../site/SiteIcon.vue';
import StyleRowMenu from './StyleRowMenu.vue';

export default Vue.extend({
  name: 'StyleListRow',

  components: {
    SConfirmDialog,
    SListItem,
    SText,
    SToggleSwitch,
    SiteIcon,
    StyleRowMenu,
  },

  props: {
    url: {
      type: String,
      required: true,
    },

    modifiedTime: {
      type: String,
      required: true,
    },

    enabled: {
      type: Boolean,
      required: true,
    },

    profileCount: {
      type: Number,
      default: 1,
    },

    // Whether the row opens the style's CSS, which iPhone doesn't offer.
    editingEnabled: {
      type: Boolean,
      default: true,
    },
  },

  data(): { showDeleteConfirm: boolean } {
    return {
      showDeleteConfirm: false,
    };
  },

  computed: {
    linkAttrs(): Record<string, string> {
      return this.editingEnabled ? { role: 'link', tabindex: '0' } : {};
    },

    linkListeners(): Record<string, (event: Event) => void> {
      return this.editingEnabled
        ? { click: this.edit, keydown: this.editOnEnter }
        : {};
    },

    editListeners(): Record<string, () => void> {
      return this.editingEnabled ? { edit: this.edit } : {};
    },

    /**
     * How many profiles the style has, when it has more than one, and when
     * it was last edited.
     */
    meta(): string {
      const edited = formatDistanceToNow(new Date(this.modifiedTime), {
        addSuffix: true,
      });

      return this.profileCount > 1
        ? `${this.t('profile_count', [String(this.profileCount)])} · ${edited}`
        : edited;
    },
  },

  methods: {
    edit(): void {
      this.$emit('edit', this.url);
    },

    editOnEnter(event: Event): void {
      if (
        (event as KeyboardEvent).key === 'Enter' &&
        event.target === event.currentTarget
      ) {
        this.edit();
      }
    },

    openSite(): void {
      window.open(`https://${this.url}`, '_blank');
    },
  },
});
</script>

<style lang="scss" scoped>
.meta {
  @include truncate;
}

.control {
  display: flex;
}

.toggle-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
