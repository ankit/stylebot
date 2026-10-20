<template>
  <textarea
    v-if="multiline"
    class="text-input multiline"
    :value="value"
    :rows="rows"
    v-bind="$attrs"
    @input="$emit('input', $event.target.value)"
    @change="$emit('change', $event.target.value)"
  ></textarea>
  <input
    v-else
    class="text-input"
    :value="value"
    v-bind="$attrs"
    @input="$emit('input', $event.target.value)"
    @change="$emit('change', $event.target.value)"
  />
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * A bordered text field for forms, single-line or `multiline`, used with
 * v-model. Other attributes, such as placeholder and maxlength, go to the
 * field itself.
 */
export default Vue.extend({
  name: 'STextInput',

  inheritAttrs: false,

  props: {
    value: {
      type: String,
      default: '',
    },

    multiline: {
      type: Boolean,
      default: false,
    },

    rows: {
      type: Number,
      default: 2,
    },
  },
});
</script>

<style lang="scss" scoped>
.text-input {
  @include field-border(8px);

  box-sizing: border-box;
  width: 100%;
  padding: 9px 11px;
  font: inherit;
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--field-fill);
  outline: none;

  &::placeholder {
    color: var(--field-placeholder);
  }

  &:focus {
    @include field-active-border;
  }

  &::-webkit-search-cancel-button,
  &::-webkit-search-decoration {
    appearance: none;
  }
}

.text-input[type='search'] {
  appearance: none;
}

.multiline {
  min-height: 60px;
  resize: vertical;
}
</style>
