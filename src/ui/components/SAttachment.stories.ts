import type { Meta } from '@storybook/vue';

import SAttachment from './SAttachment.vue';
import { InspectorIcon } from '@stylebot/icons';
import { fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Display/SAttachment',
  component: SAttachment,
};

export default meta;

const components = { SAttachment, InspectorIcon };

/* A page-like thumbnail: a pink bar over a sidebar and body. */
const THUMBNAIL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32"><rect width="48" height="32" fill="#fff"/><rect width="48" height="6" fill="#f472b6"/><rect y="6" width="12" height="26" fill="#e5e7eb"/></svg>'
)}`;

export const Element = fromTemplate(
  components,
  `
  <div class="sb-row">
    <s-attachment mono remove-label="Remove">
      <template #media><inspector-icon :size="14" /></template>
      .article-body
      <template #meta>2 matches</template>
    </s-attachment>
  </div>
`
);

export const NoMatches = fromTemplate(
  components,
  `
  <div class="sb-row">
    <s-attachment mono warning remove-label="Remove">
      <template #media><inspector-icon :size="14" /></template>
      .sidebar-promo
      <template #meta>No matches</template>
    </s-attachment>
  </div>
`
);

export const Image = fromTemplate(
  components,
  `
  <div class="sb-row">
    <s-attachment remove-label="Remove">
      <template #media>
        <img :src="src" alt="" style="width: 52px; height: 100%; object-fit: cover; object-position: top left" />
      </template>
      Screenshot
      <template #meta>1 KB</template>
    </s-attachment>
  </div>
`,
  { data: () => ({ src: THUMBNAIL }) }
);

export const LongLabel = fromTemplate(
  components,
  `
  <div style="width: 280px">
    <s-attachment mono remove-label="Remove">
      <template #media><inspector-icon :size="14" /></template>
      main > div.layout-grid > section.article-wrapper:nth-of-type(2) > p.article-body
      <template #meta>12 matches</template>
    </s-attachment>
  </div>
`
);

export const Small = fromTemplate(
  components,
  `
  <div class="sb-row">
    <s-attachment mono size="small">
      <template #media><inspector-icon :size="11" /></template>
      .article-body
    </s-attachment>
  </div>
`
);
