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
        <s-chip v-for="(part, i) in parts" :key="i">{{ part }}</s-chip>
      </span>
      <s-count-badge
        v-if="styleCount > 0"
        :count="styleCount"
        class="style-count"
      />
    </span>
  </menu-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { MenuItem, SCountBadge, SChip } from '@stylebot/components';
import { validateSelector, getRuleForSelector } from '@stylebot/css';
import { Highlighter } from '@stylebot/highlighter';

export default Vue.extend({
  name: 'TheCssSelectorDropdownItem',

  components: {
    MenuItem,
    SCountBadge,
    SChip,
  },

  props: {
    selector: {
      type: String,
      required: true,
    },
    styleCount: {
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
      getStylebotDeclarations: this.getStylebotDeclarations,
      getMountRoot: () => this.$root.$el as HTMLElement,
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

    getStylebotDeclarations(
      selector: string
    ): Array<{ property: string; value: string }> | null {
      const rule = getRuleForSelector(this.$store.state.css, selector);

      if (!rule) {
        return null;
      }

      const declarations: Array<{ property: string; value: string }> = [];
      rule.walkDecls(decl => {
        declarations.push({ property: decl.prop, value: decl.value });
      });

      return declarations.length > 0 ? declarations : null;
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

.style-count {
  margin-top: 2px;
}

.css-selector-dropdown-item:hover .chip,
.css-selector-dropdown-item:focus-visible .chip {
  background: var(--panel-surface);
}
</style>
