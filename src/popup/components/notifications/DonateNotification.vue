<template>
  <b-list-group-item v-if="!seen" button @click="open">
    <b-icon icon="heart-fill" style="color: #ff5f5f" />
    <span class="pl-2">{{ t('donate') }}</span>

    <b-button class="dismiss-btn" :title="t('hide')" @click="dismiss">
      <b-icon icon="x" scale="1.4" />
    </b-button>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { getNotification, setNotification } from '@stylebot/utils';

export default Vue.extend({
  name: 'DonateNotification',

  data(): {
    seen?: boolean;
  } {
    return {
      seen: false,
    };
  },

  async created() {
    this.seen = await getNotification('donate');
  },

  methods: {
    open(): void {
      chrome.tabs.create({
        url: 'https://ko-fi.com/stylebot',
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
      setNotification('donate', true);
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