<template>
  <s-dialog @cancel="$emit('cancel')">
    <s-dialog-card :title="t('import_backup')">
      <div class="body">
        <ul class="summary">
          <li v-for="line in lines" :key="line">
            <s-text>{{ line }}</s-text>
          </li>
        </ul>

        <s-text v-if="!hasChanges" variant="muted">
          {{ t('import_nothing_new') }}
        </s-text>

        <s-text v-if="preview.notInBackup > 0" variant="muted">
          {{ notInBackupNote }}
        </s-text>
      </div>

      <template #actions>
        <s-button variant="ghost" @click="$emit('cancel')">
          {{ t('cancel') }}
        </s-button>

        <s-button
          v-if="preview.notInBackup > 0"
          variant="danger"
          @click="$emit('replace')"
        >
          {{ t('replace_all') }}
        </s-button>

        <s-button
          variant="primary"
          :disabled="!hasChanges"
          @click="$emit('merge')"
        >
          {{ t('merge') }}
        </s-button>
      </template>
    </s-dialog-card>
  </s-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SButton, SDialog, SDialogCard, SText } from '@stylebot/components';
import type { ImportPreview } from '@stylebot/saved-styles';

export default Vue.extend({
  name: 'ImportBackupDialog',

  components: {
    SButton,
    SDialog,
    SDialogCard,
    SText,
  },

  props: {
    preview: {
      type: Object as PropType<ImportPreview>,
      required: true,
    },
  },

  computed: {
    hasChanges(): boolean {
      return this.preview.added + this.preview.updated > 0;
    },

    lines(): Array<string> {
      const { added, updated, unchanged } = this.preview;

      return [
        added > 0 &&
          this.t(
            added === 1 ? 'import_new_styles_one' : 'import_new_styles_other',
            [String(added)]
          ),
        updated > 0 &&
          this.t(
            updated === 1
              ? 'import_changed_styles_one'
              : 'import_changed_styles_other',
            [String(updated)]
          ),
        unchanged > 0 &&
          this.t(
            unchanged === 1
              ? 'import_matching_styles_one'
              : 'import_matching_styles_other',
            [String(unchanged)]
          ),
      ].filter((line): line is string => Boolean(line));
    },

    notInBackupNote(): string {
      const count = this.preview.notInBackup;

      return this.t(
        count === 1 ? 'import_not_in_backup_one' : 'import_not_in_backup_other',
        [String(count)]
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0 20px;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding-left: 18px;
}
</style>
