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
    highlighter: Highlighter | null;
  } {
    return {
      highlighter: null,
    };
  },

  computed: {
    enabled(): boolean {
      return this.$store.state.inspecting;
    },
  },

  watch: {
    enabled(newValue: boolean): void {
      if (!newValue) {
        this.highlighter?.stopInspecting();
      }
    },
  },

  created() {
    this.highlighter = new Highlighter({ onSelect: this.select });

    if (this.$store.state.options.mode === 'basic') {
      this.$store.commit('setInspecting', true);
      this.highlighter.startInspecting();
    }
  },

  methods: {
    toggle(): void {
      if (this.enabled) {
        this.highlighter?.stopInspecting();
        this.$store.commit('setInspecting', false);
      } else {
        this.highlighter?.startInspecting();
        this.$store.commit('setInspecting', true);
        this.$store.dispatch('setActiveSelector', '');
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
