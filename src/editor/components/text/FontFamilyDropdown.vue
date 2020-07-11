<template>
  <div>
    <dropdown-hack-to-support-shadow-dom>
      <b-dropdown
        right
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

  data(): { fonts: Array<string> } {
    return {
      fonts: [
        'Helvetica',
        'Roboto',
        'Lora',
        'Muli',
        'Crimson Text',
        'Inconsolata',
        'Fira Code',
      ],
    };
  },
});
</script>

<style lang="scss">
.font-family-dropdown {
  .dropdown-toggle {
    height: 26px !important;
    padding: 0 8px !important;
    padding-top: 2px !important;
  }

  .dropdown-menu {
    border: none !important;
    min-width: 120px !important;
    margin-left: 1px !important;
  }
}
</style>
