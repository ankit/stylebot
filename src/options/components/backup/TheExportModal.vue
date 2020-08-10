<template>
  <b-modal
    v-model="show"
    size="xl"
    centered
    no-fade
    :title="t('export_dialog_title')"
    no-close-on-backdrop
    no-close-on-esc
    hide-header-close
    @ok="copyJson"
    @cancel="close"
  >
    <div class="mb-3">{{ t('export_instructions') }}</div>

    <b-form-textarea readonly rows="15" autofocus :value="json" />

    <template #modal-footer="{ ok, cancel }">
      <app-button @click="cancel()">{{ t('cancel') }}</app-button>

      <app-button variant="primary" @click="ok()">
        {{ t('copy_to_clipboard') }}
      </app-button>
    </template>
  </b-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import AppButton from '../AppButton.vue';

import { copyToClipboard } from '../../utils';

export default Vue.extend({
  name: 'TheExportModal',

  components: {
    AppButton,
  },

  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },

  computed: {
    show: {
      get(): boolean {
        return this.value;
      },

      set(newValue: boolean): void {
        this.$emit('input', newValue);
      },
    },

    json(): string {
      return JSON.stringify(this.$store.state.styles);
    },
  },

  methods: {
    close(): void {
      this.$emit('close');
    },

    copyJson(): void {
      copyToClipboard(this.json);
    },
  },
});
</script>
