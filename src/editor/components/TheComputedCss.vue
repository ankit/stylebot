<template>
  <div v-if="selector" class="stylebot-computed-css">
    <h1>{{ selector }}</h1>

    <b-list-group>
      <b-list-group-item
        v-for="decl in computedCss"
        :key="decl.property"
      >{{ decl.property }}: {{ decl.value }}</b-list-group-item>
    </b-list-group>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheComputedProperties',
  computed: {
    selector(): string {
      return this.$store.state.activeSelector;
    },

    computedCss(): Array<{ property: string; value: string }> {
      const selector = this.$store.state.activeSelector;
      const el = document.querySelectorAll(selector);

      const decl = [];
      if (el.length > 0) {
        const computedStyles = window.getComputedStyle(el[0]);
        const properties = [
          { label: 'Font', property: 'font-family' },
          { label: 'Font Size', property: 'font-size' },
          { label: 'Font Style', property: 'font-style' },
          { label: 'Font Variant', property: 'font-variant' },
          { label: 'Text Decoration', property: 'text-decoration' },
          { label: 'Margin', property: 'margin' },
          { label: 'Padding', property: 'padding' },
          { label: 'Color', property: 'color' },
          { label: 'Background Color', property: 'background-color' },
        ];

        properties.forEach(({ property, label }) => {
          const value = computedStyles.getPropertyValue(property);

          decl.push({
            property: label,
            value,
          });
        });
      }

      return decl;
    },
  },
});
</script>

<style lang="scss" scoped>
.stylebot-computed-css {
  right: 350px;
  position: absolute;
  top: 0;
  background: #fff;
  z-index: 100000000000;
  font-size: 13px;
  max-height: 400px;
  overflow-y: scroll;
  width: 300px;
  word-break: break-word;
}
</style>
