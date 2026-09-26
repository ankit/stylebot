<template>
  <anchored-menu class="chat-model-anchor">
    <template #trigger="{ toggle, open }">
      <button
        type="button"
        class="chat-model-button"
        :class="{ open }"
        :aria-label="`${t('choose_a_model')}: ${model.name}`"
        aria-haspopup="menu"
        :aria-expanded="open ? 'true' : 'false'"
        @click="toggle"
      >
        <s-text as="span" size="caption" class="chat-model-name">
          {{ model.shortName }}
        </s-text>
        <chevron-down-icon :size="10" class="chat-model-chevron" />
      </button>
    </template>

    <template #default="{ close }">
      <s-menu dense :min-width="270">
        <s-text size="small" variant="muted" class="chat-model-heading">
          {{ t('provider_models', [info.name]) }}
        </s-text>

        <menu-item
          v-for="option in info.models"
          :key="option.id"
          :selected="option.id === model.id"
          :aria-checked="option.id === model.id ? 'true' : 'false'"
          role="menuitemradio"
          @click="
            pick(option.id);
            close();
          "
        >
          <span class="chat-model-option">
            <s-text as="span" size="label" class="chat-model-option-name">
              {{ option.name }}
            </s-text>
            <s-text as="span" size="caption" variant="muted">
              {{ describe(option) }}
            </s-text>
          </span>
        </menu-item>

        <hr class="chat-model-divider" />

        <menu-item
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
        </menu-item>
        <menu-item
          @click="
            $emit('change-key');
            close();
          "
        >
          <span class="chat-menu-action">
            <key-icon :size="14" class="chat-menu-icon" />
            {{ t('change_api_key') }}
          </span>
        </menu-item>
      </s-menu>
    </template>
  </anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { AnchoredMenu, MenuItem, SMenu, SText } from '@stylebot/components';
import { ChevronDownIcon, ComposeIcon, KeyIcon } from '@stylebot/icons';
import { getModel, getProviderInfo } from '@stylebot/chat';
import type { ChatModel, ChatProviderInfo, ChatStatus } from '@stylebot/types';

/**
 * The model in use, opening onto the provider's models, New chat and
 * Change API key.
 */
export default Vue.extend({
  name: 'ChatModelMenu',

  components: {
    AnchoredMenu,
    ChevronDownIcon,
    ComposeIcon,
    KeyIcon,
    MenuItem,
    SMenu,
    SText,
  },

  computed: {
    status(): ChatStatus {
      return this.$store.state.chat.status;
    },

    info(): ChatProviderInfo {
      return getProviderInfo(this.status.provider);
    },

    model(): ChatModel {
      return getModel(this.status.provider, this.status.model);
    },

    hasTurns(): boolean {
      return this.$store.state.chat.turns.length > 0;
    },
  },

  methods: {
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
      this.$store.dispatch('chat/setModel', model);
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

.chat-model-option .chat-model-option-name {
  font-weight: 500;
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

.chat-model-divider {
  height: 1px;
  margin: 0 2px 2px;
  border: 0;
  background: var(--panel-border);
}
</style>
