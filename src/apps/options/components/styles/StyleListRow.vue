<template>
  <div
    class="row"
    role="link"
    tabindex="0"
    @click="$emit('edit', url)"
    @keydown.enter.self="$emit('edit', url)"
  >
    <span class="toggle" @click.stop>
      <s-toggle-switch :value="enabled" @change="onToggle">
        <span class="toggle-label">{{ url }}</span>
      </s-toggle-switch>
    </span>

    <s-text
      as="span"
      size="label"
      class="domain"
      :variant="enabled ? 'default' : 'muted'"
    >
      {{ url }}
    </s-text>

    <s-text as="span" variant="muted" class="meta">
      <template v-if="profileCount > 1">
        {{ t('profile_count', [String(profileCount)]) }}
      </template>
    </s-text>

    <s-text as="span" variant="muted" class="meta timestamp">
      {{ formattedTimestamp }}
    </s-text>

    <span class="actions" @click.stop>
      <style-row-menu
        :url="url"
        :size="28"
        @open-site="openSite"
        @copy-css="copyCss"
        @delete="showDeleteConfirm = true"
      />
    </span>

    <span v-if="showDeleteConfirm" @click.stop>
      <s-confirm-dialog
        :title="t('delete_style_for_url', [url])"
        :message="t('delete_style_warning')"
        :confirm-label="t('delete')"
        @cancel="showDeleteConfirm = false"
        @confirm="
          showDeleteConfirm = false;
          $emit('delete');
        "
      />
    </span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

import { SToggleSwitch, SConfirmDialog, SText } from '@stylebot/components';
import StyleRowMenu from './StyleRowMenu.vue';

export default Vue.extend({
  name: 'StyleListRow',

  components: {
    SToggleSwitch,
    SConfirmDialog,
    SText,
    StyleRowMenu,
  },

  props: {
    url: {
      type: String,
      required: true,
    },

    css: {
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
  },

  data(): { showDeleteConfirm: boolean } {
    return {
      showDeleteConfirm: false,
    };
  },

  computed: {
    formattedTimestamp(): string {
      return formatDistanceToNow(new Date(this.modifiedTime), {
        addSuffix: true,
      });
    },
  },

  methods: {
    onToggle(): void {
      this.$emit('toggle');
    },

    openSite(): void {
      window.open(`https://${this.url}`, '_blank');
    },

    copyCss(): void {
      navigator.clipboard.writeText(this.css);
    },
  },
});
</script>

<style lang="scss" scoped>
.row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto 28px;
  align-items: center;
  gap: 16px;
  height: 44px;
  padding: 0 6px 0 12px;
  border-radius: 8px;
  outline: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: var(--hover-tint);
  }

  @include focus-ring;
}

.toggle {
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

.domain {
  @include truncate;
}

.meta {
  white-space: nowrap;
}

.timestamp {
  min-width: 92px;
  text-align: right;
}

.actions {
  display: flex;
}
</style>
