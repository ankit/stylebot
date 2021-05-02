<template>
  <b-list-group-item v-if="!seen" button @click="open">
    <b-icon icon="broadcast" />
    <span class="pl-2">{{ t('see_whats_new_3_1') }}</span>

    <b-button class="dismiss-btn" :title="t('hide')" @click="dismiss">
      <b-icon icon="x" scale="1.4" />
    </b-button>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { getNotification, setNotification } from '@stylebot/utils';

export default Vue.extend({
  name: 'ReleaseNotification',

  data(): {
    seen?: boolean;
  } {
    return {
      seen: false,
    };
  },

  async created() {
    this.seen = await getNotification('release/3.1');
    this.seen = false;
  },

  methods: {
    open(): void {
      chrome.tabs.create({
        url: 'https://stylebot.dev/releases/3.1',
      });

      window.close();
      this.markAsSeen();
    },

    dismiss(e: MouseEvent): void {
      e.preventDefault();
      e.stopPropagation();

      this.markAsSeen();
    },

    markAsSeen(): void {
      this.seen = true;
      setNotification('release/3.1', true);
    },
  },
});
</script>

<style lang="scss" scoped>
.dismiss-btn {
  float: right;
  padding: 1px 5px;

  &:hover {
    color: #fff;
    background: #555;
  }
}
</style>