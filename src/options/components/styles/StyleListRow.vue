<template>
  <div class="row">
    <toggle-switch bare :value="enabled" @change="onToggle" />

    <div class="domain" :class="{ disabled: !enabled }">{{ url }}</div>

    <div class="timestamp">{{ formattedTimestamp }}</div>

    <app-button variant="ghost" @click="$emit('edit', url)">{{ t('edit') }}</app-button>

    <style-row-menu :url="url" @open-site="openSite" @copy-css="copyCss" @delete="showDeleteConfirm = true" />

    <confirm-dialog
      v-if="showDeleteConfirm"
      :title="`Delete style for ${url}`"
      :message="t('delete_style_warning')"
      :confirm-label="t('delete')"
      @cancel="showDeleteConfirm = false"
      @confirm="
        showDeleteConfirm = false;
        $emit('delete');
      "
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

import { ToggleSwitch } from '@stylebot/components';
import AppButton from '../AppButton.vue';
import ConfirmDialog from '../ConfirmDialog.vue';
import StyleRowMenu from './StyleRowMenu.vue';

export default Vue.extend({
  name: 'StyleListRow',

  components: {
    ToggleSwitch,
    AppButton,
    ConfirmDialog,
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
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--border);
}

.domain {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.3;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.disabled {
    color: var(--muted-foreground);
  }
}

.timestamp {
  flex: none;
  font-size: 12px;
  color: var(--muted-foreground);
}
</style>
