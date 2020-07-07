<template>
  <b-btn
    @click="toggle"
    class="inspector"
    title="Select an element in the page to style it"
    :variant="enabled ? 'primary' : 'outline-secondary'"
  >
    <b-icon icon="pencil-square" />
  </b-btn>
</template>

<script lang="ts">
import Vue from 'vue';
import Highlighter from '../../highlighter/Highlighter';

export default Vue.extend({
  name: 'TheInspector',

  data(): {
    enabled: boolean;
    highlighter: Highlighter | null;
  } {
    return {
      enabled: false,
      highlighter: null,
    };
  },

  created() {
    this.highlighter = new Highlighter({ onSelect: this.select });
  },

  methods: {
    toggle(): void {
      if (this.enabled) {
        this.enabled = false;
        this.highlighter?.stopInspecting();
      } else {
        this.enabled = true;
        this.highlighter?.startInspecting();
      }
    },

    select(selector: string): void {
      this.toggle();
      this.$emit('select', selector);
    },
  },
});
</script>

<style lang="scss" scoped>
.inspector {
  outline: none !important;
  font-size: 21px !important;
  border-color: #ccc !important;
  padding: 13px 13px 10px 13px !important;

  &:hover,
  &:focus {
    outline: none;
    cursor: pointer;
  }

  &.enabled {
    outline: none;
  }
}
</style>
