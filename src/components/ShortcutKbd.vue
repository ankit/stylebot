<template>
  <span class="shortcut-kbd" :class="{ small }">
    <template v-for="(part, index) in formatted.parts">
      <kbd :key="index">
        <component :is="iconFor(part.icon)" v-if="part.icon" :size="iconSize" />
        <template v-else>{{ part.text }}</template>
      </kbd>
      <span
        v-if="index < formatted.parts.length - 1"
        :key="`joiner-${index}`"
        class="joiner"
      >
        {{ formatted.joiner }}
      </span>
    </template>
  </span>
</template>

<script lang="ts">
import Vue, { Component } from 'vue';

import {
  formatShortcut,
  FormattedShortcut,
  ModifierIcon,
} from './utils/format-shortcut';
import {
  OptionKeyIcon,
  ShiftKeyIcon,
  CommandKeyIcon,
  ControlKeyIcon,
} from '@stylebot/icons';

const MODIFIER_ICONS: Record<ModifierIcon, Component> = {
  option: OptionKeyIcon,
  shift: ShiftKeyIcon,
  command: CommandKeyIcon,
  control: ControlKeyIcon,
};

export default Vue.extend({
  name: 'ShortcutKbd',

  props: {
    value: {
      type: String,
      required: true,
    },

    small: {
      type: Boolean,
      default: false,
    },

    // Forces macOS vs non-Mac rendering; left unset to auto-detect.
    mac: {
      type: Boolean,
      default: undefined,
    },
  },

  computed: {
    formatted(): FormattedShortcut {
      return formatShortcut(this.value, this.mac);
    },

    iconSize(): number {
      return this.small ? 10 : 12;
    },
  },

  methods: {
    iconFor(icon?: ModifierIcon): Component | undefined {
      return icon && MODIFIER_ICONS[icon];
    },
  },
});
</script>

<style lang="scss" scoped>
.shortcut-kbd {
  display: inline-flex;
  align-items: flex-end;
}

kbd {
  display: inline-flex;
  align-items: flex-end;
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 13px;
  line-height: 12px;
  letter-spacing: 0.3px;

  svg {
    display: block;
  }
}

.small kbd {
  font-size: 11px;
  line-height: 10px;
  letter-spacing: -0.2px;
}

.joiner {
  font-size: 11px;
  line-height: 1;
  margin: 0 1px;
  color: var(--text-muted);
}
</style>
