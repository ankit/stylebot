<template>
  <div>
    <app-button variant="danger" @click="modal = true">
      {{ t('open_delete_all_styles_dialog') }}
    </app-button>

    <b-modal
      v-model="modal"
      size="md"
      centered
      no-fade
      :title="t('delete_all_styles')"
      no-close-on-backdrop
      no-close-on-esc
      hide-header-close
      @ok="
        modal = false;
        $emit('click');
      "
      @cancel="modal = false"
    >
      {{ t('delete_all_warning') }}

      <template #modal-footer="{ ok, cancel }">
        <app-button @click="cancel()">{{ t('cancel') }}</app-button>

        <app-button variant="danger" @click="ok()">
          {{ t('delete_all_styles') }}
        </app-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import AppButton from '../AppButton.vue';

export default Vue.extend({
  name: 'TheDeleteAllStylesButton',

  components: {
    AppButton,
  },

  data(): { modal: boolean } {
    return {
      modal: false,
    };
  },
});
</script>
