<template>
  <div>
    <b-input-group class="stylebot-css-selector">
      <b-form-input
        @blur="unhighlight"
        v-model="selector"
        @input="highlight(selector)"
        @focus="highlight(selector)"
        placeholder="Enter CSS selector..."
      />

      <template v-slot:append>
        <b-dropdown variant="outline-secondary">
          <div
            :key="selector"
            v-for="selector in selectors"
            @mouseenter="highlight(selector)"
            @mouseleave="unhighlight"
          >
            <b-dropdown-item>
              {{ selector }}
            </b-dropdown-item>
          </div>
        </b-dropdown>
      </template>
    </b-input-group>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Highlighter from '../highlighter/Highlighter';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  props: ['initialSelector', 'selectors'],

  data(): any {
    return {
      highlighter: null,
      selector: this.initialSelector,
    };
  },

  watch: {
    initialSelector(newVal: string): void {
      this.selector = newVal;
    },
  },

  created() {
    this.highlighter = new Highlighter({
      onSelect: () => {
        return;
      },
    });
  },

  methods: {
    validate(selector: string): boolean {
      try {
        document.querySelector(selector);
        return true;
      } catch (e) {
        return false;
      }
    },

    highlight(selector: string): void {
      if (!selector) {
        this.unhighlight();
      } else if (this.validate(selector)) {
        this.highlighter.highlight(selector);
      }
    },

    unhighlight(): void {
      this.highlighter.unhighlight();
    },
  },
});
</script>

<style lang="scss">
.stylebot-css-selector {
  margin-left: 8px;

  .form-control {
    height: 30px !important;
    font-size: 13px !important;
  }

  .dropdown-toggle {
    height: 30px !important;
    padding: 0 8px !important;
    padding-top: 3px !important;
  }
}
</style>
