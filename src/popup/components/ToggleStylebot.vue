<template>
  <b-list-group-item button class="open-stylebot" @click="toggle">
    <inspector-icon />

    <span v-if="isOpen" class="pl-2">{{ t('close_stylebot') }}</span>
    <span v-else class="pl-2">{{ t('open_stylebot') }}</span>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { toggleStylebot } from '../utils';
import InspectorIcon from './InspectorIcon.vue';

export default Vue.extend({
  name: 'ToggleStylebot',

  components: {
    InspectorIcon,
  },

  props: {
    tab: {
      type: Object,
      required: true,
    },

    isOpen: Boolean,
  },

  methods: {
    toggle(): void {
      toggleStylebot(this.tab);
    },
  },
});
</script>

<style lang="scss">
.open-stylebot {
  svg {
    height: 18px;
    width: 18px;

    path {
      fill: #495057;
    }
  }
}
</style>
