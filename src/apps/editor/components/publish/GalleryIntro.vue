<script lang="ts">
import type { CreateElement, VNode } from 'vue';
import Vue from 'vue';
import { SExternalLink, SText } from '@stylebot/components';
import { GALLERY_SITE_URL } from '@stylebot/gallery';

// Stands in for the link while the sentence is split around it.
const LINK_MARKER = '\uE000';

/**
 * What publishing does, with a link to the Gallery wherever the language puts
 * it in the sentence. A render function, since a template's line breaks would
 * add spaces around the link.
 */
export default Vue.extend({
  name: 'GalleryIntro',

  render(h: CreateElement): VNode {
    const [before, after = ''] = this.t('share_this_style_in_the_gallery', [
      LINK_MARKER,
    ]).split(LINK_MARKER);

    const link = h(SExternalLink, { props: { href: GALLERY_SITE_URL } }, [
      this.t('stylebot_gallery'),
    ]);

    return h(SText, { props: { size: 'large' } }, [before, link, after]);
  },
});
</script>
