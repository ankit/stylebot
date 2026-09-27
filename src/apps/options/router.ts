import Vue from 'vue';
import type { Route, RouteConfig } from 'vue-router';
import VueRouter from 'vue-router';

import TheBasicsTab from './components/TheBasicsTab.vue';
import TheStylesTab from './components/TheStylesTab.vue';
import TheHistoryTab from './components/TheHistoryTab.vue';
import TheSyncTab from './components/TheSyncTab.vue';
import TheStyleEditorPage from './components/styles/TheStyleEditorPage.vue';

export const TABS = ['basics', 'styles', 'history', 'sync'] as const;

export type Tab = (typeof TABS)[number];

const queryString = (value: Route['query'][string]): string =>
  typeof value === 'string' ? value : '';

export const routes: Array<RouteConfig> = [
  { path: '/', redirect: '/basics' },
  {
    path: '/basics',
    name: 'basics',
    component: TheBasicsTab,
    meta: { tab: 'basics' },
  },
  {
    path: '/styles',
    name: 'styles',
    component: TheStylesTab,
    meta: { tab: 'styles' },
  },
  {
    path: '/styles/edit',
    name: 'style-edit',
    component: TheStyleEditorPage,
    meta: { tab: 'styles' },
    props: route => ({ initialUrl: queryString(route.query.url) }),
  },
  {
    path: '/history',
    name: 'history',
    component: TheHistoryTab,
    meta: { tab: 'history' },
  },
  {
    path: '/sync',
    name: 'sync',
    component: TheSyncTab,
    meta: { tab: 'sync' },
  },
  { path: '*', redirect: '/basics' },
];

/**
 * Abstract mode is for Storybook and Jest; it does no initial navigation,
 * so callers start it with `router.replace(...)`.
 */
export const createRouter = (mode: 'hash' | 'abstract' = 'hash'): VueRouter => {
  Vue.use(VueRouter);
  return new VueRouter({ mode, routes });
};
