<template>
  <menu-item
    class="css-selector-dropdown-item"
    @click="click"
    @mouseenter.native="preview"
    @mouseleave.native="clearPreview"
    @focus.native="preview"
    @blur.native="clearPreview"
  >
    <span class="item-row">
      <span class="chips">
        <span v-for="(part, i) in parts" :key="i" class="chip">{{ part }}</span>
      </span>
      <span v-if="count > 0" class="count">{{ count }}</span>
    </span>
  </menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { MenuItem } from '@stylebot/components';
import { validateSelector } from '@stylebot/css';
import { Highlighter } from '@stylebot/highlighter';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    MenuItem,
  },

  props: {
    selector: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
  },

  data(): { highlighter: Highlighter | null } {
    return {
      highlighter: null,
    };
  },

  computed: {
    parts(): Array<string> {
      return this.selector
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
    },
  },

  created() {
    this.highlighter = new Highlighter({
      onSelect: () => {
        return;
      },
    });
  },

  beforeDestroy() {
    // The menu unmounts on select/close, so the pointer/focus leave events
    // may never fire to clear a preview highlight — clear it here.
    this.highlighter?.unhighlight();
  },

  methods: {
    click(): void {
      this.$emit('select');
    },

    preview(): void {
      // Skip whole-page selectors — highlighting them just floods the page.
      const wholePage = ['*', 'body', 'html', ':root'];
      if (this.parts.some(part => wholePage.includes(part))) {
        this.highlighter?.unhighlight();
        return;
      }

      if (validateSelector(this.selector)) {
        this.highlighter?.highlight(this.selector);
      } else {
        this.highlighter?.unhighlight();
      }
    },

    clearPreview(): void {
      this.highlighter?.unhighlight();
    },
  },
});
</script>

<style lang="scss" scoped>
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.chips {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  min-width: 0;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  color: var(--foreground);
  overflow-wrap: anywhere;
}

.count {
  flex: none;
  margin-top: 2px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted-foreground);
}

.css-selector-dropdown-item:hover .chip,
.css-selector-dropdown-item:focus-visible .chip {
  background: var(--background);
}
</style>
