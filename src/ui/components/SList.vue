<template>
  <div class="list"><slot /></div>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * A rounded, bordered list with a divider between its items, which are
 * usually SListItems, or blocks that hold one.
 */
export default Vue.extend({
  name: 'SList',
});
</script>

<style lang="scss" scoped>
.list {
  overflow: clip;
  border: 1px solid var(--panel-border);
  border-radius: 14px;

  ::v-deep {
    > * + * {
      border-top: 1px solid var(--panel-border);
    }
  }
}
</style>
