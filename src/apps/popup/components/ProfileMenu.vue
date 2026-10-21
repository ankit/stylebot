<template>
  <s-menu
    dense
    class="row-menu"
    :min-width="180"
    @keydown.native="onKeydown"
    @click.native.stop
  >
    <template v-if="!confirming">
      <s-menu-item @click="$emit('edit')">{{ t('edit') }}</s-menu-item>
      <s-menu-item @click="$emit('rename')">{{ t('rename') }}</s-menu-item>
      <s-menu-item v-if="publishItem" @click="$emit('publish')">
        <span class="publish-item">
          <span>{{ t(publishItem.label) }}</span>
          <s-status-dot v-if="publishItem.changed" tone="warning" :size="8" />
        </span>
      </s-menu-item>
      <s-menu-divider />
      <s-menu-item danger @click="startConfirm">{{ t('delete') }}</s-menu-item>
    </template>

    <div v-else class="confirm">
      <span class="confirm-message">{{ t('delete_this_profile') }}</span>
      <div class="confirm-actions">
        <s-button size="small" @click="$emit('close')">
          {{ t('cancel') }}
        </s-button>
        <s-button size="small" variant="danger" @click="$emit('delete')">
          {{ t('delete') }}
        </s-button>
      </div>
    </div>
  </s-menu>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import {
  SButton,
  SMenu,
  SMenuDivider,
  SMenuItem,
  SStatusDot,
} from '@stylebot/components';

import type { GalleryMenuItem } from '@stylebot/gallery';

/**
 * A profile row's own actions, opened from its •••. Delete asks again in
 * place, so the popup never loses the menu to a dialog.
 */
export default Vue.extend({
  name: 'ProfileMenu',

  components: {
    SButton,
    SMenu,
    SMenuDivider,
    SMenuItem,
    SStatusDot,
  },

  props: {
    // Publishing to the Gallery, where the profile can be.
    publishItem: {
      type: Object as PropType<GalleryMenuItem | null>,
      default: null,
    },
  },

  data(): { confirming: boolean } {
    return { confirming: false };
  },

  mounted() {
    this.focusItem(0);
  },

  methods: {
    items(): Array<HTMLElement> {
      return Array.from(this.$el.querySelectorAll<HTMLElement>('button'));
    },

    focusItem(index: number): void {
      const items = this.items();

      items[(index + items.length) % items.length]?.focus();
    },

    async startConfirm(): Promise<void> {
      this.confirming = true;
      await this.$nextTick();

      this.focusItem(0);
    },

    onKeydown(event: KeyboardEvent): void {
      const index = this.items().indexOf(document.activeElement as HTMLElement);

      if (event.key === 'Escape') {
        // The popup itself closes on an Escape left to it.
        event.preventDefault();
        event.stopPropagation();
        this.$emit('close');
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        this.focusItem(index + (event.key === 'ArrowDown' ? 1 : -1));
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.row-menu {
  position: absolute;
  top: calc(100% + 2px);
  right: 4px;
  z-index: 1;
}

.publish-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

.confirm {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 8px 4px;
}

.confirm-message {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.confirm-actions {
  display: flex;
  gap: 6px;

  > * {
    flex: 1;
  }
}
</style>
