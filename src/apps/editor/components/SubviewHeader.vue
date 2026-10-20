<template>
  <div class="subview-header">
    <div class="back" @click="$emit('back')">
      <s-icon-button :size="28" :tooltip="t('back')" @click="$emit('back')">
        <chevron-left-icon :size="12" />
      </s-icon-button>

      <s-heading as="h1" size="md" class="title">{{ title }}</s-heading>
    </div>

    <div class="actions">
      <slot />
      <the-close-action v-if="closable && $store.state.host === 'page'" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SHeading, SIconButton } from '@stylebot/components';
import { ChevronLeftIcon } from '@stylebot/icons';

import TheCloseAction from './header/TheCloseAction.vue';

/**
 * The header of a view that takes over the panel, such as keyboard
 * shortcuts: a back button and the title, either emitting `back`, and
 * anything in the default slot on the right, then Stylebot's close button
 * when `closable`.
 */
export default Vue.extend({
  name: 'SubviewHeader',

  components: {
    SHeading,
    SIconButton,
    ChevronLeftIcon,
    TheCloseAction,
  },

  props: {
    title: {
      type: String,
      required: true,
    },

    closable: {
      type: Boolean,
      default: false,
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
  padding: 8px calc(var(--panel-gutter) - 5px) 8px 10px;
  background: var(--panel-surface);
  border-bottom: 1px solid var(--panel-border);
}

.back {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
}

.actions {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--icon-color);
}

.back .title {
  @include truncate;

  min-width: 0;
}
</style>
