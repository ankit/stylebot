<template>
  <b-modal
    size="xl"
    centered
    no-fade
    v-model="show"
    @ok="importJson"
    @cancel="cancel"
    title="Paste previously exported JSON"
    no-close-on-backdrop
    no-close-on-esc
    hide-header-close
  >
    <div class="mb-3" v-if="!error">
      This will overwrite your existing styles. You can't undo this.
    </div>

    <div v-if="error">
      We encountered an error importing the JSON. Please ensure it is properly
      formatted and try again.
    </div>

    <b-form-textarea
      rows="15"
      autofocus
      v-model="json"
      @input="error = false"
    />

    <template v-slot:modal-footer="{ ok, cancel }">
      <app-button text="Cancel" @click="cancel()" />

      <app-button
        text="Import"
        @click="ok()"
        variant="primary"
        :disabled="!json"
      />
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

  data(): {
    json: string;
    error: boolean;
  } {
    return {
      json: '',
      error: false,
    };
  },

  methods: {
    cancel(): void {
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
