<template>
  <div>
    <heading as="h2">{{ t('fonts') }}</heading>
    <text-block class="description">{{ t('fonts_description') }}</text-block>

    <div class="fonts-box" @click="focusInput">
      <span v-for="(font, index) in fonts" :key="font" class="chip">
        {{ font }}
        <button
          type="button"
          class="chip-remove"
          :aria-label="`Remove ${font}`"
          @click.stop="removeFont(index)"
        >
          <icon-x />
        </button>
      </span>

      <input
        ref="input"
        v-model="newFont"
        class="font-input"
        :placeholder="fonts.length ? '' : t('fonts_placeholder')"
        @keydown.enter.prevent="commitNewFont"
        @keydown="onKeydown"
        @blur="commitNewFont"
      />
    </div>

    <a
      class="link"
      target="_blank"
      href="https://fonts.google.com/"
    >
      {{ t('browse_google_fonts') }}
    </a>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { defaultOptions } from '@stylebot/settings';
import { IconX, Heading, TextBlock } from '@stylebot/components';

export default Vue.extend({
  name: 'TheFonts',

  components: {
    IconX,
    Heading,
    TextBlock,
  },

  data(): { newFont: string } {
    return {
      newFont: '',
    };
  },

  computed: {
    fonts(): Array<string> {
      return this.$store.state.options['fonts'] || defaultOptions.fonts;
    },
  },

  methods: {
    setFonts(fonts: Array<string>): void {
      this.$store.dispatch('setOption', { name: 'fonts', value: fonts });
    },

    removeFont(index: number): void {
      const fonts = [...this.fonts];
      fonts.splice(index, 1);
      this.setFonts(fonts);
    },

    commitNewFont(): void {
      const font = this.newFont.trim();

      if (font) {
        this.setFonts([...this.fonts, font]);
      }

      this.newFont = '';
    },

    onKeydown(event: KeyboardEvent): void {
      if (event.key === ',') {
        event.preventDefault();
        this.commitNewFont();
        return;
      }

      if (event.key === 'Backspace' && !this.newFont && this.fonts.length) {
        this.removeFont(this.fonts.length - 1);
      }
    },

    focusInput(): void {
      (this.$refs.input as HTMLInputElement)?.focus();
    },
  },
});
</script>

<style lang="scss" scoped>
.description {
  margin-top: 4px;
  max-width: 520px;
}

.fonts-box {
  margin-top: 14px;
  padding: 8px;
  border-radius: 9px;
  border: 1px solid var(--ui-border);
  background: var(--ui-hover-bg);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  cursor: text;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 4px 4px 9px;
  border-radius: 6px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-icon-btn-border);
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--ui-fg);
}

.chip-remove {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  color: var(--ui-fg-muted);
  cursor: pointer;

  svg {
    width: 8px;
    height: 8px;
  }

  &:hover {
    background: var(--ui-hover-bg);
    color: var(--ui-fg);
  }
}

.font-input {
  all: unset;
  flex: 1;
  min-width: 120px;
  padding: 4px;
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--ui-fg);

  &::placeholder {
    color: var(--ui-fg-muted);
  }
}

.link {
  display: inline-block;
  margin-top: 9px;
  font-weight: 400;
  font-size: 12.5px;
  line-height: 1.3;
}
</style>
