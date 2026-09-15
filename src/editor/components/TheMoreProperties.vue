<template>
  <div class="more-properties">
    <div v-for="decl in declarations" :key="decl.property" class="more-property-row">
      <s-text class="more-property-key">{{ decl.property }}</s-text>
      <s-text variant="primary" class="more-property-value">{{ decl.value }}</s-text>

      <button
        type="button"
        class="more-property-remove"
        :aria-label="t('remove')"
        @click="remove(decl.property)"
      >
        <icon-x :size="15" />
      </button>
    </div>

    <div v-if="adding" class="add-property-form">
      <input
        ref="keyInput"
        v-model="newProperty"
        class="add-property-input"
        :placeholder="t('property')"
        spellcheck="false"
        @keydown.enter="commitAdd"
        @keydown.esc="cancelAdd"
      />
      <input
        v-model="newValue"
        class="add-property-input"
        :placeholder="t('value')"
        spellcheck="false"
        @keydown.enter="commitAdd"
        @keydown.esc="cancelAdd"
      />
      <button type="button" class="add-property-confirm" @click="commitAdd">
        <check-icon :size="12" />
      </button>
    </div>

    <button
      v-else
      type="button"
      class="add-property-button"
      :disabled="disabled"
      @click="startAdd"
    >
      <span class="add-property-plus">+</span> {{ t('add_property') }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import { IconX, CheckIcon } from '@stylebot/icons';
import { SText } from '@stylebot/components';
import { KNOWN_PROPERTIES } from '../utils/basic-properties';

export default Vue.extend({
  name: 'TheMoreProperties',

  components: {
    IconX,
    CheckIcon,
    SText,
  },

  data(): { adding: boolean; newProperty: string; newValue: string } {
    return {
      adding: false,
      newProperty: '',
      newValue: '',
    };
  },

  computed: {
    declarations(): Array<{ property: string; value: string }> {
      const activeRule = this.$store.getters.activeRule;
      const declarations: Array<{ property: string; value: string }> = [];

      if (activeRule) {
        activeRule.clone().walkDecls((decl: Declaration) => {
          if (!KNOWN_PROPERTIES.includes(decl.prop)) {
            declarations.push({ property: decl.prop, value: decl.value });
          }
        });
      }

      return declarations;
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    remove(property: string): void {
      this.$store.dispatch('applyDeclaration', { property, value: '' });
    },

    startAdd(): void {
      this.adding = true;
      this.newProperty = '';
      this.newValue = '';

      this.$nextTick(() => {
        (this.$refs.keyInput as HTMLInputElement | undefined)?.focus();
      });
    },

    cancelAdd(): void {
      this.adding = false;
    },

    commitAdd(): void {
      const property = this.newProperty.trim();
      const value = this.newValue.trim();

      if (!property || !value) {
        return;
      }

      this.$store.dispatch('applyDeclaration', { property, value });
      this.adding = false;
    },
  },
});
</script>

<style lang="scss" scoped>
.more-property-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 7%, transparent);
}

.more-property-key {
  flex: none;
  font-family: var(--font-mono);
}

.more-property-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
}

.more-property-remove {
  @include button-reset;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  outline: none;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }

  @include focus-ring;
}

.add-property-form {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0 2px;
}

.add-property-input {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  @include field-border(6px);
  padding: 5px 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  background: var(--field-fill);

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    outline: none;
    @include field-active-border;
  }
}

.add-property-confirm {
  @include button-reset;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  @include field-border(6px);
  color: var(--accent);
  outline: none;
  cursor: pointer;

  &:hover {
    background: var(--hover-tint);
  }

  @include focus-ring;
}

.add-property-button {
  @include button-reset;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  margin-top: 2px;
  padding: 7px;
  border: 1px dashed var(--panel-border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-muted);
  outline: none;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--field-border-hover);
  }

  @include focus-ring;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.add-property-plus {
  font-weight: 600;
}
</style>
