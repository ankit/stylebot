<template>
  <s-anchored-menu class="chat-model-anchor">
    <template #trigger="{ toggle, open }">
      <button
        type="button"
        class="chat-model-button"
        :class="{ open }"
        :aria-label="`${t('choose_a_model')}: ${model.name}`"
        aria-haspopup="menu"
        :aria-expanded="open ? 'true' : 'false'"
        @click="
          level = null;
          toggle();
        "
      >
        <s-text as="span" size="caption" class="chat-model-name">
          {{ model.shortName }}
        </s-text>
        <chevron-down-icon :size="10" class="chat-model-chevron" />
      </button>
    </template>

    <template #default="{ close }">
      <s-menu ref="menu" dense :min-width="270">
        <s-menu-item
          v-if="level"
          class="chat-model-back"
          @click="openLevel(null)"
        >
          <span class="chat-menu-action">
            <chevron-left-icon :size="12" class="chat-menu-icon" />
            {{ shown.name }}
          </span>
        </s-menu-item>
        <s-text
          v-else
          size="caption"
          variant="muted"
          class="chat-model-heading"
        >
          {{ t('provider_models', [shown.name]) }}
        </s-text>

        <s-menu-item
          v-for="option in shown.models"
          :key="option.id"
          :selected="isCurrent(option)"
          :aria-checked="isCurrent(option) ? 'true' : 'false'"
          role="menuitemradio"
          @click="
            pick(option.id);
            close();
          "
        >
          <span class="chat-model-option">
            <s-text as="span" size="label">
              {{ option.name }}
            </s-text>
            <s-text as="span" size="caption" variant="muted">
              {{ describe(option) }}
            </s-text>
          </span>
        </s-menu-item>

        <template v-if="!level">
          <template v-if="others.length">
            <s-menu-divider />
            <s-menu-item
              v-for="other in others"
              :key="other.id"
              aria-haspopup="menu"
              @click="openLevel(other.id)"
            >
              <span class="chat-menu-action">
                <span class="chat-model-other-name">{{ other.name }}</span>
                <s-text as="span" size="caption" variant="muted">
                  {{ t('count_models', [String(other.models.length)]) }}
                </s-text>
                <chevron-right-icon :size="10" class="chat-menu-icon" />
              </span>
            </s-menu-item>
          </template>

          <s-menu-divider />

          <s-menu-item
            :disabled="!hasTurns"
            @click="
              $emit('new-chat');
              close();
            "
          >
            <span class="chat-menu-action">
              <compose-icon :size="14" class="chat-menu-icon" />
              {{ t('new_chat') }}
            </span>
          </s-menu-item>
          <s-menu-item
            @click="
              $emit('providers');
              close();
            "
          >
            <span class="chat-menu-action">
              <key-icon :size="14" class="chat-menu-icon" />
              {{ t('providers') }}
            </span>
          </s-menu-item>
        </template>
      </s-menu>
    </template>
  </s-anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  SAnchoredMenu,
  SMenuItem,
  SMenuDivider,
  SMenu,
  SText,
} from '@stylebot/components';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ComposeIcon,
  KeyIcon,
} from '@stylebot/icons';
import { getModel, getProviderInfo } from '@stylebot/chat';
import type {
  ChatModel,
  ChatProviderId,
  ChatProviderInfo,
  ChatStatus,
} from '@stylebot/types';

/**
 * The model in use, opening onto the current provider's models. Other
 * connected providers sit below as rows that open their models in place;
 * New chat and Providers stay at the bottom.
 */
export default Vue.extend({
  name: 'ChatModelMenu',

  components: {
    SAnchoredMenu,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ComposeIcon,
    KeyIcon,
    SMenuItem,
    SMenuDivider,
    SMenu,
    SText,
  },

  data(): { level: ChatProviderId | null } {
    return {
      // Another provider whose models are open in place of the current's.
      level: null,
    };
  },

  computed: {
    status(): ChatStatus {
      return this.$store.state.chat.status;
    },

    model(): ChatModel {
      return getModel(this.status.provider, this.status.model);
    },

    // The provider whose models are showing.
    shown(): ChatProviderInfo {
      return getProviderInfo(this.level ?? this.status.provider);
    },

    others(): Array<ChatProviderInfo> {
      return this.status.providers
        .filter(({ id, connected }) => connected && id !== this.status.provider)
        .map(({ id }) => getProviderInfo(id));
    },

    hasTurns(): boolean {
      return this.$store.state.chat.turns.length > 0;
    },
  },

  methods: {
    /**
     * Swaps the rows for another provider's models, or back. Focus moves
     * to the menu first: the clicked row is about to go, and focus lost
     * with it would close the menu.
     */
    openLevel(level: ChatProviderId | null): void {
      const menu = (this.$refs.menu as Vue).$el as HTMLElement;

      menu.focus();
      this.level = level;
      this.$nextTick(() =>
        menu.querySelector<HTMLElement>('[role^="menuitem"]')?.focus()
      );
    },

    isCurrent(model: ChatModel): boolean {
      return (
        this.shown.id === this.status.provider && model.id === this.status.model
      );
    },

    describe(model: ChatModel): string {
      switch (model.tier) {
        case 'fastest':
          return this.t('fastest_and_cheapest');
        case 'best':
          return this.t('best_for_large_redesigns');
        default:
          return this.t('balanced_good_for_most_edits');
      }
    },

    pick(model: string): void {
      this.$store.dispatch('chat/setModel', {
        provider: this.shown.id,
        model,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-model-anchor ::v-deep .anchored-menu-panel {
  right: auto;
  left: -8px;
}

.chat-model-button {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  margin-left: -6px;
  padding: 0 6px;
  border-radius: 7px;
  color: var(--icon-color);
  cursor: pointer;

  &:hover,
  &.open {
    background: var(--hover-tint);
  }

  @include focus-ring;
}

.chat-model-button .chat-model-name {
  font-weight: 500;
  white-space: nowrap;
}

.chat-model-chevron {
  transform: rotate(180deg);
}

.chat-model-heading {
  padding: 6px 8px 5px;
}

.chat-model-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-model-back {
  font-weight: 600;
}

.chat-model-other-name {
  flex: 1;
}

.chat-menu-action {
  display: flex;
  align-items: center;
  gap: 9px;
}

.chat-menu-icon {
  flex: none;
  color: var(--icon-color);
}
</style>
