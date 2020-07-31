<template>
  <div>
    <dropdown-hack-to-support-shadow-dom>
      <b-dropdown
        right
        size="sm"
        :disabled="disabled"
        variant="outline-secondary"
        class="font-family-dropdown"
      >
        <b-dropdown-item
          v-for="font in fonts"
          :key="font"
          @click="$emit('select', font)"
        >
          {{ font }}
        </b-dropdown-item>
      </b-dropdown>
    </dropdown-hack-to-support-shadow-dom>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import DropdownHackToSupportShadowDom from './../DropdownHackToSupportShadowDom.vue';

export default Vue.extend({
  name: 'FontFamilyDropdown',

  components: {
    DropdownHackToSupportShadowDom,
  },

  props: {
    disabled: {
      type: Boolean,
      required: true,
    },
    fonts: {
      type: Array,
      required: true,
    },
  },
});
</script>

<style lang="scss">
.font-family-dropdown {
  .dropdown-toggle {
    height: 28px !important;
    padding: 0 8px !important;
    line-height: 30px !important;
  }

  .dropdown-menu {
    border: none !important;
    min-width: 120px !important;
    margin-left: 1px !important;
  }
}
</style>
