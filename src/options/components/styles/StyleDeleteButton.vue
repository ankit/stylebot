<template>
  <div>
    <b-btn
      variant="outline-danger"
      size="sm"
      @click="modal = true"
      class="icon-btn"
      title="Delete Style"
    >
      <b-icon icon="trash" />
    </b-btn>

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
      title="Delete style for url"
      no-close-on-backdrop
      no-close-on-esc
      hide-header-close
    >
      This will permanently delete your style. You can't undo this.

      <template v-slot:modal-footer="{ ok, cancel }">
        <app-button text="Cancel" @click="cancel()" />
        <app-button text="Delete" variant="danger" @click="ok()" />
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import AppButton from '../AppButton.vue';

export default Vue.extend({
  name: 'StyleDeleteButton',

  props: {
    url: {
      type: String,
      required: true,
    },
  },

  components: {
    AppButton,
  },

  data(): {
    modal: boolean;
  } {
    return {
      modal: false,
    };
  },
});
</script>

<style lang="scss" scoped>
.icon-btn {
  font-size: 13px;
  border-radius: 30px;
  height: 35px;
  width: 36px;
  padding: 0;
}
</style>
