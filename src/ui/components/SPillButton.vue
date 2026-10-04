<template>
  <button type="button" class="pill-btn" @click="$emit('click', $event)">
    <span class="pill-btn-label"><slot /></span>
    <span v-if="$slots.trailing" class="pill-btn-trailing">
      <slot name="trailing" />
    </span>
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SPillButton',
});
</script>

<style lang="scss" scoped>
.pill-btn {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 8px;
  flex: 1;
  min-height: 40px;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--pill-border);
  background: var(--pill-surface);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--pill-hover);
  }

  @include focus-ring;
}

.pill-btn-label {
  grid-column: 2;
  text-align: center;
}

.pill-btn-trailing {
  display: flex;
  grid-column: 3;
  justify-self: end;
}
</style>
