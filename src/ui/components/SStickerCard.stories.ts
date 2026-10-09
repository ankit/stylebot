import type { Meta, StoryObj } from '@storybook/vue';

import SStickerCard from './SStickerCard.vue';
import {
  focusViaTab,
  fromTemplate,
  playground,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Buttons/SStickerCard',
  component: SStickerCard,
  argTypes: {
    text: { control: 'text' },
    tilt: { control: { type: 'select' }, options: [0, 1, 2] },
  },
  args: { text: 'Paper & ink', tilt: 0 },
};

export default meta;

const preview = (background: string) =>
  `<template #preview><div style="height: 100%; background: ${background}"></div></template>`;

export const Playground = playground(
  { SStickerCard },
  `
  <div style="width: 112px">
    <s-sticker-card :tilt="tilt" @click="() => {}">
      ${preview('#f3eee3')}
      {{ text }}
    </s-sticker-card>
  </div>
`
);

export const Row = fromTemplate(
  { SStickerCard },
  `
  <div style="display: grid; grid-template-columns: repeat(3, 112px); gap: 8px">
    <s-sticker-card :tilt="0" @click="() => {}">${preview(
      '#f3eee3'
    )}Paper &amp; ink</s-sticker-card>
    <s-sticker-card :tilt="1" @click="() => {}">${preview(
      '#0c0f0c'
    )}Terminal</s-sticker-card>
    <s-sticker-card :tilt="2" @click="() => {}">${preview(
      '#1e1814'
    )}Only the links in color</s-sticker-card>
  </div>
`
);

export const Focused: StoryObj = {
  ...fromTemplate(
    { SStickerCard },
    `
    <div style="width: 112px">
      <s-sticker-card @click="() => {}">${preview(
        '#eef0ee'
      )}Calm</s-sticker-card>
    </div>
  `
  ),
  play: ({ canvasElement }) => focusViaTab(canvasElement),
};

export const Selected = fromTemplate(
  { SStickerCard },
  `
  <div style="display: grid; grid-template-columns: repeat(3, 112px); gap: 8px; padding-top: 8px">
    <s-sticker-card :tilt="0" :selected="true" @click="() => {}">${preview(
      '#f3eee3'
    )}Paper &amp; ink</s-sticker-card>
    <s-sticker-card :tilt="1" :selected="false" @click="() => {}">${preview(
      '#0c0f0c'
    )}Terminal</s-sticker-card>
    <s-sticker-card :tilt="2" :selected="false" @click="() => {}">${preview(
      '#1e1814'
    )}Only the links in color</s-sticker-card>
  </div>
`
);
