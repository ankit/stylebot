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
  border: 1px solid var(--panel-border);
  border-radius: 14px;

  ::v-deep {
    > :not(:first-child) {
      border-top: 1px solid var(--panel-border);
    }

    > :first-child,
    > :first-child > :first-child {
      border-top-left-radius: 13px;
      border-top-right-radius: 13px;
    }

    > :last-child,
    > :last-child > :last-child {
      border-bottom-left-radius: 13px;
      border-bottom-right-radius: 13px;
    }
  }
}
</style>
