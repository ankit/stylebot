<template>
  <input
    ref="input"
    :value="value"
    class="name-input"
    autocomplete="off"
    :class="{ invalid: !!error }"
    :aria-label="t('profile_name')"
    :aria-invalid="error ? 'true' : 'false'"
    :title="error"
    @input="onInput"
    @keydown.enter.prevent="$emit('submit')"
    @keydown.esc.prevent.stop="$emit('cancel')"
    @blur="$emit(cancelOnBlur ? 'cancel' : 'submit')"
  />
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * The field a profile's name turns into while it's named, focused with
 * its text selected.
 */
export default Vue.extend({
  name: 'ProfileNameInput',

  props: {
    value: {
      type: String,
      default: '',
    },

    error: {
      type: String,
      default: '',
    },

    // Leaving the field throws the name away instead of saving it.
    cancelOnBlur: Boolean,
  },

  mounted() {
    const input = this.$refs.input as HTMLInputElement;

    input.focus();
    input.select();
  },

  methods: {
    onInput(event: Event): void {
      this.$emit('input', (event.target as HTMLInputElement).value);
    },
  },
});
</script>

<style lang="scss" scoped>
.name-input {
  flex: 1;
  width: 0;
  min-width: 0;
  height: 26px;
  margin-left: -6px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  outline: none;
  font: inherit;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--field-surface);
  box-shadow: 0 0 0 1.5px var(--accent);

  &.invalid {
    box-shadow: 0 0 0 1.5px var(--danger);
  }
}
</style>
