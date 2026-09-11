<template>
  <div class="the-chat-editor d-flex flex-column">
    <div v-if="!apiKeyConfigured" class="px-3 pt-3">
      <p class="mb-0">
        {{ t('css_generator_missing_api_key') }}
        <a href="#" @click.prevent="openOptions">{{ t('add_claude_api_key') }}</a>
      </p>
    </div>

    <template v-else>
      <div class="chat-toolbar px-3 py-2 d-flex justify-content-between align-items-center">
        <b-form-select
          v-model="model"
          size="sm"
          class="chat-model-select"
          :options="modelOptions"
          :title="t('chat_model_description')"
        />

        <span class="chat-session-cost text-muted" :title="t('chat_session_cost_description')">
          {{ formattedSessionCost }}
        </span>
      </div>

      <div ref="messages" class="chat-messages flex-grow-1">
        <p v-if="messages.length === 0" class="chat-empty text-muted px-3 pt-3 mb-0">
          {{ t('chat_empty_state') }}
        </p>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="chat-message px-3 py-2"
        >
          <p v-if="message.role === 'user'" class="mb-0 chat-message-user">
            {{ message.text }}
          </p>

          <p
            v-else-if="message.status === 'success'"
            class="mb-0 chat-message-success"
          >
            {{ message.message }}
          </p>

          <p v-else class="mb-0 text-danger chat-message-error">
            {{ errorMessage(message.error) }}
          </p>
        </div>

        <p v-if="generating" class="chat-generating px-3 py-2 text-muted mb-0">
          <b-icon icon="arrow-repeat" animation="spin" />
          {{ t('generating_css') }}
        </p>
      </div>

      <div class="chat-input px-3 py-2">
        <b-form-textarea
          ref="promptInput"
          v-model="prompt"
          :placeholder="t('css_generator_placeholder')"
          :disabled="generating"
          rows="2"
          max-rows="4"
          @keydown.enter.exact.prevent="submit"
        />

        <div class="mt-2 d-flex justify-content-between align-items-center">
          <b-button
            class="chat-select-element"
            :variant="inspecting ? 'primary' : 'outline-secondary'"
            size="sm"
            :disabled="generating"
            :title="t('chat_select_element')"
            @click="toggleInspecting"
          >
            <inspector-icon />
          </b-button>

          <b-button
            variant="primary"
            size="sm"
            :disabled="!prompt.trim() || generating"
            @click="submit"
          >
            {{ t('chat_send') }}
          </b-button>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ChatMessage } from '../store';
import { openOptionsPage } from '../utils/chrome';
import InspectorIcon from './header/InspectorIcon.vue';

export default Vue.extend({
  name: 'TheChatEditor',

  components: {
    InspectorIcon,
  },

  data() {
    return {
      prompt: '',
    };
  },

  computed: {
    generating(): boolean {
      return this.$store.state.aiGenerating;
    },

    messages(): Array<ChatMessage> {
      return this.$store.state.chatMessages;
    },

    apiKeyConfigured(): boolean {
      return !!this.$store.state.options.claudeApiKey;
    },

    inspecting(): boolean {
      return this.$store.state.inspecting;
    },

    selectedElement(): string | null {
      return this.$store.state.chatSelectedElement;
    },

    model: {
      get(): string {
        return this.$store.state.options.claudeModel;
      },

      set(value: string): void {
        this.$store.dispatch('setClaudeModel', value);
      },
    },

    modelOptions(): Array<{ value: string; text: string }> {
      return [
        { value: 'claude-haiku-4-5', text: this.t('chat_model_haiku') },
        { value: 'claude-sonnet-5', text: this.t('chat_model_sonnet') },
        { value: 'claude-opus-4-8', text: this.t('chat_model_opus') },
      ];
    },

    sessionCost(): number {
      return this.$store.state.sessionCost;
    },

    formattedSessionCost(): string {
      return `$${this.sessionCost.toFixed(4)}`;
    },
  },

  watch: {
    messages(): void {
      this.scrollToBottom();
    },

    generating(): void {
      this.scrollToBottom();
    },

    selectedElement(selector: string | null): void {
      if (!selector) {
        return;
      }

      const reference = `\`${selector}\` `;
      this.prompt = this.prompt && !this.prompt.endsWith(' ')
        ? `${this.prompt} ${reference}`
        : `${this.prompt}${reference}`;

      this.$store.commit('setChatSelectedElement', null);

      this.$nextTick(() => {
        const input = this.$refs.promptInput as Vue | undefined;
        (input?.$el as HTMLTextAreaElement | undefined)?.focus();
      });
    },
  },

  methods: {
    submit(): void {
      const prompt = this.prompt.trim();

      if (!prompt || this.generating) {
        return;
      }

      this.prompt = '';
      this.$store.dispatch('sendChatMessage', prompt);
    },

    openOptions(): void {
      openOptionsPage();
    },

    toggleInspecting(): void {
      if (this.inspecting) {
        this.$store.commit('setInspecting', false);
      } else {
        this.$store.commit('setChatSelectedElement', null);
        this.$store.commit('setInspecting', true);
      }
    },

    errorMessage(error: string): string {
      switch (error) {
        case 'missing_api_key':
        case 'invalid_api_key':
          return this.t('css_generator_error_api_key');
        case 'rate_limited':
          return this.t('css_generator_error_rate_limited');
        case 'refusal':
          return this.t('css_generator_error_refusal');
        default:
          return this.t('css_generator_error_generic');
      }
    },

    scrollToBottom(): void {
      this.$nextTick(() => {
        const el = this.$refs.messages as HTMLElement | undefined;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.the-chat-editor {
  height: 100%;
}

.chat-toolbar {
  flex: 0 0 auto;
  border-bottom: 1px solid #ddd;
}

.chat-model-select {
  width: auto;
  font-size: 12px;
}

.chat-session-cost {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.chat-messages {
  overflow-y: auto;
}

.chat-message + .chat-message {
  border-top: 1px solid #eee;
}

.chat-message-user {
  font-weight: 500;
}

.chat-input {
  flex: 0 0 auto;
  border-top: 1px solid #ddd;
}

.chat-select-element {
  svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  path {
    fill: #555;
  }

  &.btn-primary path {
    fill: #fff;
  }
}
</style>
