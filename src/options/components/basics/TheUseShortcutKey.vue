<template>
  <div>
    <h5>Shortcut Key</h5>

    <b-form-checkbox switch @change="set" v-model="useShortcutKey">
      Enable shortcut key to launch Stylebot
    </b-form-checkbox>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { getOption, saveOption } from '../../utilities';

export default Vue.extend({
  name: 'TheUseShortcutKey',

  data(): {
    useShortcutKey: boolean;
  } {
    return {
      useShortcutKey: true,
    };
  },

  created(): void {
    this.useShortcutKey = getOption('useShortcutKey');
  },

  methods: {
    set(value: boolean): void {
      saveOption('useShortcutKey', value);
    },
  },
});
</script>
