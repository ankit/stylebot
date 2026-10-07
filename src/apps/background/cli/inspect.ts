import {
  CREATIVE_SUGGESTIONS,
  getCreativeSuggestions,
  getPracticalSuggestions,
} from '@stylebot/chat';
import type { ChatSuggestionContext } from '@stylebot/chat';

import { inspectTab, resolveTab } from './targets';
import type { CliCommands } from './types';

// As many as Chat's empty state deals.
const SUGGESTION_COUNT = 3;

const DEFAULT_COMPUTED_PROPERTIES = [
  'display',
  'position',
  'width',
  'height',
  'margin',
  'padding',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'border',
];

export const inspectCommands: CliCommands = {
  async suggestions({ tab }) {
    const { id } = await resolveTab(tab);
    // Like Chat, a page that can't be read still gets suggestions.
    const context = await inspectTab<ChatSuggestionContext>(id as number, {
      kind: 'suggestionContext',
    }).catch((): ChatSuggestionContext => ({ signals: null, article: false }));

    const practical = getPracticalSuggestions(context);
    const creative = getCreativeSuggestions(
      Math.floor(Math.random() * CREATIVE_SUGGESTIONS.length),
      SUGGESTION_COUNT - practical.length
    );

    return [...practical, ...creative].map(suggestion => ({
      id: suggestion.id,
      label: chrome.i18n.getMessage(suggestion.label, suggestion.substitutions),
      request: suggestion.request,
    }));
  },

  async cssVariables({ tab }) {
    const { id } = await resolveTab(tab);
    return inspectTab<string>(id as number, { kind: 'cssVariables' });
  },

  async pageRules({ tab, selector }) {
    const { id } = await resolveTab(tab);

    return inspectTab<string>(id as number, {
      kind: 'pageRules',
      selector: String(selector),
    });
  },

  async computedStyles({ tab, selector, properties }) {
    const { id } = await resolveTab(tab);
    const wanted = Array.isArray(properties) ? properties.map(String) : [];

    return inspectTab<Record<string, string>>(id as number, {
      kind: 'computedStyles',
      selector: String(selector),
      properties: wanted.length ? wanted : DEFAULT_COMPUTED_PROPERTIES,
    });
  },

  async matchCount({ tab, selectors }) {
    const { id } = await resolveTab(tab);
    const list = Array.isArray(selectors) ? selectors.map(String) : [];
    const counts = await inspectTab<Array<number | null>>(id as number, {
      kind: 'matchCount',
      selectors: list,
    });

    return list.map((selector, i) => ({ selector, count: counts[i] }));
  },
};
