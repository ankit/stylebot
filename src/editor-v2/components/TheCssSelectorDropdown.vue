<template>
  <div>
    <v-select
      taggable
      :value="selected"
      :options="selectors"
      :clearable="false"
      placeholder="Enter CSS selector"
      class="stylebot-selector-dropdown"
    >
      <template #no-options>
        No styled CSS selectors
      </template>
    </v-select>

    <b-icon icon="chevron-down" class="stylebot-selector-dropdown-icon" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import vSelect from 'vue-select';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',
  props: ['selected', 'selectors'],

  components: {
    vSelect,
  },
});
</script>

<style lang="scss">
.stylebot-selector-dropdown {
  font-size: 14px;

  .vs__search {
    color: #555;
  }

  .vs__dropdown-menu {
    color: #fff !important;
    background: #333 !important;
    max-width: 250px !important;
  }

  .vs__dropdown-option {
    color: #fff !important;
  }

  .vs__open-indicator {
    display: none !important;
  }
}

.stylebot-selector-dropdown-icon {
  top: 10px;
  right: 10px;
  color: #555;
  font-size: 12px;
  position: absolute;
  pointer-events: none;
}
</style>
