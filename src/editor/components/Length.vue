<template>
  <b-input-group style="width: 100px">
    <b-form-input size="sm" v-model="length" />

    <template v-slot:append>
      <b-dropdown
        size="sm"
        :text="unit"
        v-model="unit"
        variant="outline-secondary"
      >
        <b-dropdown-item :key="unit" v-for="unit in supportedUnits">
          {{ unit }}
        </b-dropdown-item>
      </b-dropdown>
    </template>
  </b-input-group>
</template>

<script lang="ts">
import Vue from 'vue';

type Unit = 'px' | 'em' | '%' | string;

export default Vue.extend({
  name: 'Length',

  props: {
    property: {
      type: String,
      required: true,
    },
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
