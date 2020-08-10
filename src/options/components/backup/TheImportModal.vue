<template>
  <b-modal
    v-model="show"
    size="xl"
    centered
    no-fade
    :title="t('import_dialog_title')"
    no-close-on-backdrop
    no-close-on-esc
    hide-header-close
    @ok="importJson"
    @cancel="close"
  >
    <div v-if="!error" class="mb-3">
      {{ t('import_instructions') }}
    </div>

    <div v-if="error">
      {{ t('import_error') }}
    </div>

    <b-form-textarea
      v-model="json"
      rows="15"
      autofocus
      @input="error = false"
    />

    <template #modal-footer="{ ok, cancel }">
      <app-button @click="cancel()">{{ t('cancel') }}</app-button>

      <app-button variant="primary" :disabled="!json" @click="ok()">
        {{ t('import') }}
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
