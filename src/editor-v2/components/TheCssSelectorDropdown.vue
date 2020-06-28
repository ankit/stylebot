<template>
  <div>
    <b-dropdown
      class="stylebot-selector-dropdown"
      v-if="selector"
      :text="selector"
      variant="outline-secondary"
    ></b-dropdown>

    <b-dropdown
      v-if="!selector"
      text="Select an element"
      variant="outline-secondary"
      class="stylebot-selector-dropdown"
    ></b-dropdown>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',
  props: ['selector'],
});
</script>
