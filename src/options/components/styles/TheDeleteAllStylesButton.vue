<template>
  <div>
    <app-button variant="danger" @click="modal = true">
      Delete all...
    </app-button>

    <b-modal
      v-model="modal"
      size="md"
      centered
      no-fade
      title="Delete All Styles"
      no-close-on-backdrop
      no-close-on-esc
      hide-header-close
      @ok="
        modal = false;
        $emit('click');
      "
      @cancel="modal = false"
    >
      This will permanently delete all your styles. You can't undo this.

      <template #modal-footer="{ ok, cancel }">
        <app-button @click="cancel()">Cancel</app-button>
        <app-button variant="danger" @click="ok()">
          Delete All Styles
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
