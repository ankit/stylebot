<template>
  <div>
    <b-input-group>
      <b-form-input
        trim
        @input="input"
        @focus="focus"
        v-model="selector"
        @blur="unhighlight"
        class="stylebot-css-selector-input"
        placeholder="Enter CSS selector..."
      />

      <template v-slot:append>
        <b-dropdown
          variant="outline-secondary"
          class="stylebot-css-selector-dropdown"
        >
          <div
            :key="dropdownSelector"
            v-for="dropdownSelector in selectors"
            @mouseenter="highlight(dropdownSelector)"
            @mouseleave="unhighlight"
          >
            <b-dropdown-item>
              {{ dropdownSelector }}
            </b-dropdown-item>
          </div>
        </b-dropdown>
      </template>
    </b-input-group>

    <b-icon
      variant="danger"
      icon="exclamation-circle"
      v-if="validation.state === false"
      class="stylebot-css-selector-validation-icon"
      :title="validation.message"
      v-b-tooltip.hover.nofade.ds1000="{ customClass: 'stylebot-tooltip' }"
    />
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
      validation: { state: null, message: '' },
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
    validate(selector: string): { state: boolean | null; message: string } {
      if (!selector) {
        return { state: null, message: '' };
      }

      try {
        document.querySelector(selector);
        return { state: null, message: '' };
      } catch (e) {
        console.log('error', e);
        return { state: false, message: 'Invalid selector' };
      }
    },

    input(): void {
      this.validation = this.validate(this.selector);

      if (this.validation.state !== false) {
        this.highlight(this.selector);
      } else {
        this.unhighlight();
      }
    },

    focus(): void {
      this.validation = this.validate(this.selector);

      if (this.validation.state !== false) {
        this.highlight(this.selector);
      } else {
        this.unhighlight();
      }
    },

    highlight(selector: string): void {
      if (!selector) {
        this.unhighlight();
      } else {
        this.highlighter.highlight(selector);
      }
    },

    unhighlight(): void {
      this.highlighter.unhighlight();
    },
  },
});
</script>

<style lang="scss" scoped>
.stylebot-css-selector-validation-icon {
  top: 7px;
  right: 33px;
  z-index: 10000000;
  position: absolute;
}
</style>

<style lang="scss">
.stylebot-css-selector-input {
  height: 30px !important;
  font-size: 13px !important;
  margin-left: 8px !important;
}

.stylebot-css-selector-dropdown {
  .dropdown-toggle {
    height: 30px !important;
    padding: 0 8px !important;
    padding-top: 3px !important;
  }
}
</style>
