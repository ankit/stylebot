<template>
  <s-dialog @cancel="$emit('cancel')">
    <s-dialog-card :title="title" role="dialog">
      <template #actions>
        <button
          v-if="preview.notInBackup > 0"
          type="button"
          class="replace"
          @click="$emit('replace')"
        >
          {{ t('replace_all_deletes', [String(preview.notInBackup)]) }}
        </button>

        <s-button variant="ghost" @click="$emit('cancel')">
          {{ t('cancel') }}
        </s-button>

        <s-button variant="primary" autofocus @click="$emit('merge')">
          {{ t('import') }}
        </s-button>
      </template>
    </s-dialog-card>
  </s-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SButton, SDialog, SDialogCard } from '@stylebot/components';
import type { ImportPreview } from '@stylebot/saved-styles';

export default Vue.extend({
  name: 'ImportBackupDialog',

  components: {
    SButton,
    SDialog,
    SDialogCard,
  },

  props: {
    preview: {
      type: Object as PropType<ImportPreview>,
      required: true,
    },
  },

  computed: {
    title(): string {
      const count = this.preview.added + this.preview.updated;

      return this.t(
        count === 1 ? 'import_styles_title_one' : 'import_styles_title_other',
        [String(count)]
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.replace {
  @include button-reset;

  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--danger);
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring(2px);
}
</style>
