<template>
  <div>
    <app-button
      class="mr-2"
      size="sm"
      variant="outline-danger"
      @click="modal = true"
    >
      {{ t('open_delete_style_dialog') }}
    </app-button>

    <b-modal
      v-model="modal"
      size="md"
      centered
      no-fade
      :title="'Delete style for ' + url"
      no-close-on-backdrop
      no-close-on-esc
      hide-header-close
      @ok="
        modal = false;
        $emit('click');
      "
      @cancel="modal = false"
    >
      {{ t('delete_style_warning') }}

      <template #modal-footer="{ ok, cancel }">
        <app-button @click="cancel()">{{ t('cancel') }}</app-button>

        <app-button variant="danger" @click="ok()">
          {{ t('delete') }}
        </app-button>
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
