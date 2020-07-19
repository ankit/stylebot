<template>
  <b-modal
    v-model="show"
    size="xl"
    centered
    no-fade
    title="Paste previously exported JSON"
    no-close-on-backdrop
    no-close-on-esc
    hide-header-close
    @ok="importJson"
    @cancel="close"
  >
    <div v-if="!error" class="mb-3">
      This will overwrite your existing styles. You can't undo this.
    </div>

    <div v-if="error">
      We encountered an error importing the JSON. Please ensure it is properly
      formatted and try again.
    </div>

    <b-form-textarea
      v-model="json"
      rows="15"
      autofocus
      @input="error = false"
    />

    <template #modal-footer="{ ok, cancel }">
      <app-button @click="cancel()">Cancel</app-button>
      <app-button variant="primary" :disabled="!json" @click="ok()">
        Import
      </app-button>
    </template>
  </b-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import AppButton from '../AppButton.vue';

export default Vue.extend({
  name: 'TheImportModal',

  components: {
    AppButton,
  },

  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },

  data(): {
    json: string;
    error: boolean;
  } {
    return {
      json: '',
      error: false,
    };
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
    close(): void {
      this.json = '';
      this.error = false;
      this.$emit('close');
    },

    importJson(): void {
      try {
        const styles = JSON.parse(this.json);
        this.$store.dispatch('setAllStyles', styles);

        this.json = '';
        this.error = false;
        this.$emit('close');
      } catch (e) {
        this.error = true;
      }
    },
  },
});
</script>
