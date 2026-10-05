<template>
  <span class="chat-change-diff">
    <span v-if="added" class="chat-change-added">+{{ added }}</span>
    <span v-if="removed" class="chat-change-removed">−{{ removed }}</span>
    <slot />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * How many declarations a change added and removed, as a diff counts
 * them, in one pill that leaves out a side that's 0. Anything slotted in
 * ends the pill.
 */
export default Vue.extend({
  name: 'ChatChangeDiff',

  props: {
    added: {
      type: Number,
      required: true,
    },

    removed: {
      type: Number,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-change-diff {
  position: relative;
  display: flex;
  flex: none;
  overflow: hidden;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.chat-change-added {
  padding: 3px 5px;
  background: var(--success-background);
  color: var(--success);
}

.chat-change-removed {
  padding: 3px 5px;
  background: var(--danger-background);
  color: var(--danger);
}
</style>
