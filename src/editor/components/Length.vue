<template>
  <b-input-group class="length-input-group">
    <b-form-input size="sm" v-model="length" :disabled="disabled" />

    <template v-slot:append>
      <dropdown-hack-to-support-shadow-dom>
        <b-dropdown
          size="sm"
          :text="unit"
          v-model="unit"
          :disabled="disabled"
          variant="outline-secondary"
        >
          <b-dropdown-item :key="unit" v-for="unit in supportedUnits">
            {{ unit }}
          </b-dropdown-item>
        </b-dropdown>
      </dropdown-hack-to-support-shadow-dom>
    </template>
  </b-input-group>
</template>

<script lang="ts">
import Vue from 'vue';
import DropdownHackToSupportShadowDom from './DropdownHackToSupportShadowDom.vue';

type Unit = 'px' | 'em' | '%' | string;

export default Vue.extend({
  name: 'Length',

  props: {
    property: {
      type: String,
      required: true,
    },
  },

  components: {
    DropdownHackToSupportShadowDom,
  },

  data(): {
    supportedUnits: Array<string>;
  } {
    return {
      supportedUnits: ['px', 'em', '%'],
    };
  },

  computed: {
    length: {
      get(): string {
        const { length } = this.get();
        return length;
      },

      set(length: string): void {
        this.put(length, this.unit);
      },
    },

    unit: {
      get(): Unit {
        const { unit } = this.get();
        return unit;
      },

      set(unit: Unit): void {
        this.put(this.length, unit);
      },
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    get(): { length: string; unit: Unit } {
      const activeRule = this.$store.state.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls(this.property, decl => {
          value = decl.value;
        });
      }

      if (!value) {
        return { length: '', unit: 'px' };
      }

      const [length, unit] = value.split(/(\d+)/).filter(Boolean);

      // todo: support other units.
      // currently, we render empty input and overwrite on edit
      if (this.supportedUnits.indexOf(unit) === -1) {
        return { length: '', unit: 'px' };
      }

      return { length, unit };
    },

    put(length: string, unit: Unit): void {
      const value = length ? `${length}${unit}` : '';

      this.$store.dispatch('applyDeclaration', {
        property: this.property,
        value,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.length-input-group {
  width: 100px !important;
}
</style>
