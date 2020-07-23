<template>
  <b-input-group>
    <b-form-input
      v-model="value"
      size="sm"
      :debounce="400"
      :disabled="disabled"
      @focus="focus"
    />
    <font-family-dropdown :disabled="disabled" @select="select" />
  </b-input-group>
</template>

<script lang="ts">
import Vue from 'vue';
import FontFamilyDropdown from '../../text/FontFamilyDropdown.vue';

export default Vue.extend({
  name: 'TheReadabilityFontFamily',

  components: {
    FontFamilyDropdown,
  },

  props: {
    disabled: Boolean,
  },

  computed: {
    value: {
      get(): string {
        return this.$store.state.readabilitySettings.font;
      },

      set(value: string) {
        this.$store.dispatch('setReadabilitySettings', {
          ...this.$store.state.readabilitySettings,
          font: value,
        });
      },
    },
  },

  methods: {
    select(value: string): void {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        font: value,
      });
    },

    focus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },
  },
});
</script>
