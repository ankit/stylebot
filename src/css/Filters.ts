import * as postcss from 'postcss';

import {
  addDeclaration,
  getClassBasedSelector,
  getIdBasedSelector,
} from '@stylebot/css';

import { FilterEffect } from '@stylebot/types';

const getEffectRegex = (name: FilterEffect) => new RegExp(`${name}\\((.*)\\)$`);
const getEffectDeclarationValue = (name: FilterEffect, percent: number) =>
  `${name}(${percent}%)`;

const getSelectorsToAttachFilterForPage = (): Array<string> => {
  const el = document.querySelector('body');
  const nodes: Array<HTMLElement> = Array.prototype.slice.call(el?.childNodes);

  const filteredNodes = nodes.filter(node => {
    if (!node.tagName) {
      return false;
    }

    const tagName = node.tagName.toLowerCase();

    if (
      tagName === 'script' ||
      tagName === 'style' ||
      tagName === 'noscript' ||
      node.id === 'stylebot'
    ) {
      return false;
    }

    return true;
  });

  const selectors = filteredNodes.map(
    node => getClassBasedSelector(node) || getIdBasedSelector(node)
  );

  return selectors.filter((s): s is string => s !== null);
};

export const getFilterEffectValueForPage = (
  effectName: FilterEffect,
  css: string
): number => {
  const root = postcss.parse(css);
  const regex = getEffectRegex(effectName);
  const selectors = getSelectorsToAttachFilterForPage();

  let value = 0;
  selectors.forEach(selector => {
    if (root.some(node => node.type === 'rule' && node.selector === selector)) {
      root.walkRules(selector, rule => {
        rule.walkDecls('filter', (decl: postcss.Declaration) => {
          const matches = decl.value.match(regex);

          if (matches && matches[1]) {
            value = parseInt(matches[1]);
          }
        });
      });
    }
  });

  return value;
};

export const getCssAfterApplyingFilterEffectToPage = (
  effectName: FilterEffect,
  css: string,
  percent: number
): string => {
  let root = postcss.parse(css);

  const regex = getEffectRegex(effectName);
  const selectors = getSelectorsToAttachFilterForPage();
  const effectValue = getEffectDeclarationValue(effectName, percent);

  selectors.forEach(selector => {
    if (root.some(node => node.type === 'rule' && node.selector === selector)) {
      root.walkRules(selector, rule => {
        if (rule.some(node => node.type === 'decl' && node.prop === 'filter')) {
          rule.walkDecls('filter', (decl: postcss.Declaration) => {
            const value = decl.value.replace(regex, '').trim();
            decl.value = value ? `${value} ${effectValue}` : `${effectValue}`;
          });
        } else {
          // todo: update method interfaces to avoid doing this redundant work
          root = postcss.parse(
            addDeclaration('filter', effectValue, selector, root.toString())
          );
        }
      });
    } else {
      // todo: update method interfaces to avoid doing this redundant work
      root = postcss.parse(
        addDeclaration('filter', effectValue, selector, root.toString())
      );
    }
  });

  return root.toString();
};
