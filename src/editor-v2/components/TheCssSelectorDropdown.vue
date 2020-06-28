<template>
  <div>
    <b-dropdown
      class="stylebot-selector-dropdown"
      v-if="selector"
      size="sm"
      :text="selector"
      variant="outline-primary"
    ></b-dropdown>

    <b-dropdown
      v-if="!selector"
      size="sm"
      text="Select an element"
      variant="outline-primary"
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
