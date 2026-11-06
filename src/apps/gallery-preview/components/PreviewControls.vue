<template>
  <div class="preview-controls">
    <div class="header">
      <preview-summary
        :title="styleData.name"
        :href="styleUrl"
        :status="byline"
        :dimmed="original"
      />
      <s-icon-button
        class="action"
        :size="32"
        :tooltip="t('stop_preview')"
        tooltip-shortcut="esc"
        :aria-label="t('stop_preview')"
        :disabled="installing"
        @click="$emit('cancel')"
      >
        <x-icon :size="14" />
      </s-icon-button>
    </div>

    <div
      v-if="styleOptions.length"
      class="options"
      :class="{ dimmed: original || switching }"
    >
      <s-style-options
        :options="styleOptions"
        @option="(option, value) => $emit('option', option, value)"
      />
    </div>

    <div class="footer">
      <preview-compare
        :original="original"
        :disabled="installing"
        @change="compare"
      />
      <install-button
        class="install-button"
        :class="{ dimmed: original }"
        :installing="installing"
        :disabled="switching"
        @install="install"
        @filled="$emit('filled')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SIconButton, SStyleOptions } from '@stylebot/components';
import { XIcon } from '@stylebot/icons';
import { getGalleryByline, getGalleryStyleUrl } from '@stylebot/gallery';
import type {
  GalleryStyle,
  StyleOption,
  StyleOptionDeclarations,
  StyleOptionValues,
} from '@stylebot/types';

import InstallButton from './InstallButton.vue';
import PreviewCompare from './PreviewCompare.vue';
import PreviewSummary from './PreviewSummary.vue';

/**
 * The card while it previews a style: its name, the options it declares,
 * compare, Install, and cancel.
 * Emits `option`, `compare`, `install`, `filled` and `cancel`.
 */
export default Vue.extend({
  name: 'PreviewControls',

  components: {
    InstallButton,
    PreviewCompare,
    PreviewSummary,
    SIconButton,
    SStyleOptions,
    XIcon,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryStyle>,
      required: true,
    },

    installing: {
      type: Boolean,
      default: false,
    },

    // Waiting for another of the site's styles to replace this one.
    switching: {
      type: Boolean,
      default: false,
    },

    // The options the style declares, if any, and the values shown.
    options: {
      type: Object as PropType<StyleOptionDeclarations | undefined>,
      default: undefined,
    },

    values: {
      type: Object as PropType<StyleOptionValues>,
      default: () => ({}),
    },
  },

  data() {
    return {
      original: false,
    };
  },

  computed: {
    styleOptions(): Array<StyleOption> {
      return Object.entries(this.options ?? {}).map(([name, declaration]) => ({
        name,
        declaration,
        value: this.values[name],
      }));
    },

    styleUrl(): string {
      return getGalleryStyleUrl(this.styleData);
    },

    byline(): string {
      return getGalleryByline(this.styleData);
    },
  },

  watch: {
    'styleData.id'(): void {
      this.original = false;
    },
  },

  methods: {
    compare(original: boolean): void {
      this.original = original;
      this.$emit('compare', original);
    },

    install(event: MouseEvent): void {
      if (this.original) {
        this.compare(false);
      }

      this.$emit('install', event);
    },
  },
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 14px 10px 12px 16px;
}

.action {
  flex: none;
  color: var(--icon-color);
}

.options {
  padding: 6px;
  border-top: 1px solid var(--panel-border);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--panel-border);
}

.dimmed {
  opacity: 0.35;
  transition: opacity 0.14s ease;
}
</style>
