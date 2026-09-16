<template>
  <div class="header">
    <div class="swatch" :class="{ empty: !value }" :style="value ? { background: value } : undefined" />

    <div class="info">
      <div class="hex" :class="{ 'not-set': !value }">{{ value || t('color_picker_not_set') }}</div>
      <s-text size="small" variant="muted" as="span">{{ roleLabel }}</s-text>
    </div>

    <button v-if="value" type="button" class="pick clear" @click="$emit('clear')">
      {{ t('color_picker_clear') }}
    </button>

    <button v-if="eyeDropperSupported" type="button" class="pick" @click="pick">
      <eyedropper-icon :size="13" />
      {{ t('color_picker_pick') }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText } from '@stylebot/components';
import { EyedropperIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'ColorPickerHeader',

  components: {
    SText,
    EyedropperIcon,
  },

  props: {
    value: {
      type: String,
      default: '',
    },

    roleLabel: {
      type: String,
      required: true,
    },
  },

  computed: {
    eyeDropperSupported(): boolean {
      return typeof window.EyeDropper !== 'undefined';
    },
  },

  methods: {
    async pick(): Promise<void> {
      if (!window.EyeDropper) {
        return;
      }

      try {
        const result = await new window.EyeDropper().open();
        this.$emit('input', result.sRGBHex);
      } catch {
        // The user cancelled the pick (Escape) — nothing to do.
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--field-divider);
}

.swatch {
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 7px;
  // A literal black ring reads fine on a light panel but vanishes on a dark
  // one — mix against --text-primary so it stays visible in both themes.
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 12%, transparent);

  &.empty {
    background: var(--menu-surface);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 18%, transparent);
  }
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hex {
  font: 500 13.5px/1.2 var(--font-mono);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.not-set {
    color: var(--text-muted);
  }
}

.pick {
  @include button-reset;
  flex: none;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border: 1px solid var(--field-border);
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    border-color: var(--field-border-hover);
    color: var(--text-primary);
  }

  @include focus-ring;
}
</style>
