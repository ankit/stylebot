<template>
  <div class="subview-header">
    <s-icon-button :size="28" :tooltip="t('back')" @click="$emit('back')">
      <chevron-left-icon :size="12" />
    </s-icon-button>

    <s-heading as="h1" size="sm" class="title">{{ title }}</s-heading>

    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SHeading, SIconButton } from '@stylebot/components';
import { ChevronLeftIcon } from '@stylebot/icons';

/**
 * The header of a view that takes over the panel, such as keyboard
 * shortcuts: a back button emitting `back`, the title, and anything in the
 * default slot on the right.
 */
export default Vue.extend({
  name: 'SubviewHeader',

  components: {
    SHeading,
    SIconButton,
    ChevronLeftIcon,
  },

  props: {
    title: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.subview-header {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--panel-surface);
  border-bottom: 1px solid var(--panel-border);
}

.subview-header .title {
  @include truncate;

  flex: 1;
  min-width: 0;
}
</style>
