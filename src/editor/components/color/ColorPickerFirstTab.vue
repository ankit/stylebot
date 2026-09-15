<template>
  <div class="first-tab">
    <template v-if="colors.total > 0">
      <s-text size="small" variant="muted" as="span" class="heading">{{ heading }}</s-text>

      <div class="roles">
        <div v-for="role in roles" :key="role.key" class="role-row">
          <s-text size="small" variant="muted" as="span" class="role-name">{{ role.label }}</s-text>
          <div class="swatch-strip">
            <template v-for="i in 4">
              <button
                v-if="role.colors[i - 1]"
                :key="'c' + i"
                type="button"
                class="swatch"
                :class="{ light: needsHairline(role.colors[i - 1]) }"
                :style="{ background: role.colors[i - 1] }"
                @click="$emit('select', role.colors[i - 1])"
              >
                <check-icon v-if="role.colors[i - 1] === value" :size="12" class="swatch-check" />
              </button>
              <span v-else :key="'p' + i" class="placeholder" />
            </template>
          </div>
        </div>
      </div>
    </template>

    <s-text v-else-if="!recentColors.length" size="small" variant="muted">
      {{ t('color_picker_already_used_empty') }}
    </s-text>

    <div v-if="recentColors.length" class="recent-section" :class="{ divided: colors.total > 0 }">
      <color-picker-recent :colors="recentColors" :value="value" @select="$emit('select', $event)" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { SText } from '@stylebot/components';
import { CheckIcon } from '@stylebot/icons';
import { RoleColorGroups } from '@stylebot/css';
import ColorPickerRecent from './ColorPickerRecent.vue';
import { needsHairline } from '../../utils/hsv-color';

type Role = {
  key: 'text' | 'surface';
  label: string;
  colors: Array<string>;
};

export default Vue.extend({
  name: 'ColorPickerFirstTab',

  components: {
    SText,
    CheckIcon,
    ColorPickerRecent,
  },

  props: {
    colors: {
      type: Object as PropType<RoleColorGroups>,
      required: true,
    },

    heading: {
      type: String,
      required: true,
    },

    recentColors: {
      type: Array as PropType<Array<string>>,
      default: () => [],
    },

    value: {
      type: String,
      default: '',
    },
  },

  computed: {
    roles(): Array<Role> {
      return [
        { key: 'text', label: this.t('color_picker_role_text'), colors: this.colors.text },
        { key: 'surface', label: this.t('color_picker_role_surface'), colors: this.colors.surface },
      ];
    },
  },

  methods: {
    needsHairline,
  },
});
</script>

<style lang="scss" scoped>
.first-tab {
  padding: 12px 14px;
}

.heading {
  display: block;
  margin-bottom: 9px;
}

.roles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-name {
  width: 38px;
  flex: none;
}

.swatch-strip {
  flex: 1;
  display: flex;
  gap: 5px;
}

.swatch {
  @include button-reset;
  flex: 1;
  height: 26px;
  border-radius: 6px;
  @include swatch-states;
}

.swatch-check {
  @include swatch-check;
}

.placeholder {
  flex: 1;
  height: 26px;
  border-radius: 6px;
  background: transparent;
  border: 1px dashed var(--input);
}

.recent-section.divided {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--accent);
}
</style>
