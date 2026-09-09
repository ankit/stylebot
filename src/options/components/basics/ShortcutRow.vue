<template>
  <div class="shortcut-row">
    <div class="label">{{ label }}</div>
    <div class="control">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ShortcutRow',

  props: {
    label: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.shortcut-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid var(--ui-hover-bg);

  &:last-child {
    border-bottom: none;
  }
}

.label {
  flex: 1;
  font-weight: 400;
  font-size: 13.5px;
  line-height: 1.3;
  color: var(--ui-fg);
}

.control {
  width: 190px;
  flex: none;
}
</style>
