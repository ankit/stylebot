<template>
  <div>
    <b-input-group>
      <b-form-input
        @input="input"
        @focus="focus"
        @blur="unhighlight"
        :value="activeSelector"
        class="css-selector-input"
        placeholder="Enter CSS selector..."
      />

      <template v-slot:append>
        <b-dropdown
          right
          variant="outline-secondary"
          class="css-selector-dropdown"
        >
          <div
            :key="dropdownSelector"
            v-for="dropdownSelector in selectors"
            @click="select(dropdownSelector)"
            @mouseenter="highlight(dropdownSelector)"
            @mouseleave="unhighlight"
          >
            <b-dropdown-item>{{ dropdownSelector }}</b-dropdown-item>
          </div>
        </b-dropdown>
      </template>
    </b-input-group>

    <b-icon
      variant="danger"
      icon="exclamation-circle"
      :title="validation.message"
      v-if="validation.state === false"
      class="css-selector-validation-icon"
      v-b-tooltip.hover.nofade.ds1000="{ customClass: 'stylebot-tooltip' }"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Highlighter from '../highlighter/Highlighter';

export default Vue.extend({
  name: 'TheCssSelectorDropdown',

  computed: {
    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    selectors(): Array<string> {
      return this.$store.state.selectors;
    },
  },

  data(): any {
    return {
      highlighter: null,
      validation: { state: null, message: '' },
    };
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
        return { state: false, message: 'Invalid selector' };
      }
    },

    input(selector: string): void {
      this.$store.dispatch('setActiveSelector', selector);

      this.validation = this.validate(selector);

      if (this.validation.state !== false) {
        this.highlight(selector);
      } else {
        this.unhighlight();
      }
    },

    focus(): void {
      const selector = this.$store.state.activeSelector;
      this.validation = this.validate(selector);

      if (this.validation.state !== false) {
        this.highlight(selector);
      } else {
        this.unhighlight();
      }
    },

    select(selector: string): void {
      this.$store.dispatch('setActiveSelector', selector);
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

<style lang="scss">
.css-selector-validation-icon {
  top: 7px;
  right: 33px;
  z-index: 10000000;
  position: absolute;
}

.css-selector-input {
  &.form-control {
    height: 30px !important;
    font-size: 13px !important;
    margin-left: 8px !important;
  }
}

.css-selector-dropdown {
  .dropdown-toggle {
    height: 30px !important;
    padding: 0 8px !important;
    padding-top: 3px !important;
  }
}
</style>
