<template>
  <img
    v-if="src && !failed"
    :src="src"
    alt=""
    class="favicon"
    :class="tone && `${tone}-icon`"
    :style="{ width: `${size}px`, height: `${size}px` }"
    @load="inspect"
    @error="failed = true"
  />
  <span
    v-else
    class="letter"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${size - 3}px`,
    }"
  >
    {{ letter }}
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

const HOST = /^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+$/u;

let canReadFavicons: boolean | undefined;

/**
 * Whether this browser lets Stylebot read its favicon cache, asked once.
 */
const hasFavicons = (): boolean => {
  if (canReadFavicons === undefined) {
    canReadFavicons = Boolean(
      chrome.runtime.getManifest().permissions?.includes('favicon')
    );
  }

  return canReadFavicons;
};

/**
 * The host a style's url names, or null for a pattern that names none.
 */
const toHost = (url: string): string | null => {
  const host = url
    .replace(/^\w+:\/\//, '')
    .replace(/^\*\./, '')
    .split(/[/:?#]/)[0];

  return HOST.test(host) ? host : null;
};

/**
 * A site's favicon from the browser's own cache, so nothing is fetched, with
 * its first letter where the browser has no favicon API.
 */
export default Vue.extend({
  name: 'Favicon',

  props: {
    url: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 16,
    },
  },

  data(): { failed: boolean; tone: 'light' | 'dark' | null } {
    return { failed: false, tone: null };
  },

  computed: {
    src(): string | null {
      const host = toHost(this.url);
      if (!host || !hasFavicons()) {
        return null;
      }

      const pageUrl = encodeURIComponent(`https://${host}/`);
      return chrome.runtime.getURL(`/_favicon/?pageUrl=${pageUrl}&size=32`);
    },

    letter(): string {
      const host = this.url.replace(/^(\w+:\/\/)?(\*\.)?(www\.)?/, '');
      return (host.match(/[\p{L}\p{N}]/u)?.[0] ?? '*').toUpperCase();
    },
  },

  watch: {
    url(): void {
      this.failed = false;
      this.tone = null;
    },
  },

  methods: {
    /**
     * Chrome answers for a site it has no icon cached for with a transparent
     * image rather than an error, which would leave an empty tile. An icon
     * that is all white or all black is marked, to sit on a backing in the
     * theme it would vanish into.
     */
    inspect(event: Event): void {
      const image = event.target as HTMLImageElement;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      if (!context || !canvas.width || !canvas.height) {
        this.failed = true;
        return;
      }

      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

      let weight = 0;
      let lightness = 0;

      for (let index = 0; index < data.length; index += 4) {
        const alpha = data[index + 3] / 255;
        const luminance =
          (0.2126 * data[index] +
            0.7152 * data[index + 1] +
            0.0722 * data[index + 2]) /
          255;

        weight += alpha;
        lightness += luminance * alpha;
      }

      if (weight === 0) {
        this.failed = true;
        return;
      }

      const average = lightness / weight;

      if (average > 0.85) {
        this.tone = 'light';
      } else if (average < 0.15) {
        this.tone = 'dark';
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.favicon {
  display: block;
  flex-shrink: 0;
}

.light-icon {
  border-radius: 3px;
  background: var(--text-primary);
  box-shadow: 0 0 0 2px var(--text-primary);

  @include dark-mode {
    background: none;
    box-shadow: none;
  }
}

.dark-icon {
  @include dark-mode {
    border-radius: 3px;
    background: var(--text-primary);
    box-shadow: 0 0 0 2px var(--text-primary);
  }
}

.letter {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  line-height: 1;
  color: var(--text-secondary);
}
</style>
