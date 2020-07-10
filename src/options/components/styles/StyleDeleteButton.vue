<template>
  <div>
    <b-btn
      variant="outline-danger"
      size="sm"
      class="icon-btn"
      title="Delete Style"
      @click="modal = true"
    >
      <b-icon icon="trash" />
    </b-btn>

    <b-modal
      v-model="modal"
      size="md"
      centered
      no-fade
      title="Delete style for url"
      no-close-on-backdrop
      no-close-on-esc
      hide-header-close
      @ok="
        modal = false;
        $emit('click');
      "
      @cancel="modal = false"
    >
      This will permanently delete your style. You can't undo this.

      <template #modal-footer="{ ok, cancel }">
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

  components: {
    AppButton,
  },

  props: {
    url: {
      type: String,
      required: true,
    },
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
