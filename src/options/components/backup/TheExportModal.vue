<template>
  <b-modal
    size="xl"
    centered
    no-fade
    v-model="show"
    @ok="copyJson"
    @cancel="cancel"
    title="Copy / paste into a JSON file"
    no-close-on-backdrop
    no-close-on-esc
    hide-header-close
  >
    <div class="mb-3">Keep the JSON safe to import it later</div>

    <b-form-textarea rows="15" autofocus :value="getJson()" />

    <template v-slot:modal-footer="{ ok, cancel }">
      <app-button text="Cancel" @click="cancel()" />
      <app-button variant="primary" text="Copy to Clipboard" @click="ok()" />
    </template>
  </b-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import AppButton from '../AppButton.vue';

import { exportStylesAsJSONString, copyToClipboard } from '../../utilities';

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
  },

  methods: {
    cancel(): void {
      this.$emit('close');
    },

    copyJson(): void {
      copyToClipboard(this.getJson());
    },

    getJson(): string {
      return exportStylesAsJSONString();
    },
  },
});
</script>
