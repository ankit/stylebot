<template>
  <div>
    <h5>Context Menu</h5>

    <b-form-checkbox switch @change="set" v-model="contextMenu">
      Enable Right Click Context Menu
    </b-form-checkbox>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { getOption, saveOption } from '../../utilities';

export default Vue.extend({
  name: 'TheContextMenu',

  data(): {
    contextMenu: boolean;
  } {
    return {
      contextMenu: true,
    };
  },

  created(): void {
    this.contextMenu = getOption('contextMenu');
  },

  methods: {
    set(value: boolean): void {
      saveOption('contextMenu', value);
    },
  },
});
</script>
