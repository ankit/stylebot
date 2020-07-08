<template>
  <div>
    <app-button text="Delete all" variant="danger" @click="modal = true" />

    <b-modal
      size="md"
      centered
      no-fade
      v-model="modal"
      @ok="
        modal = false;
        $emit('click');
      "
      @cancel="modal = false"
      title="Delete All Styles"
      no-close-on-backdrop
      no-close-on-esc
      hide-header-close
    >
      This will permanently delete all your styles. You can't undo this.

      <template v-slot:modal-footer="{ ok, cancel }">
        <app-button text="Cancel" @click="cancel()" />
        <app-button text="Delete All Styles" variant="danger" @click="ok()" />
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
