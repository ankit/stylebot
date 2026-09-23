import * as postcss from 'postcss';

import { addDeclaration } from './declaration';
import { findRule } from './rule';

import { FilterEffect } from '@stylebot/types';

const getEffectRegex = (name: FilterEffect) => new RegExp(`${name}\\((.*)\\)$`);
const getEffectDeclarationValue = (name: FilterEffect, percent: string) =>
  `${name}(${percent}%)`;

/**
 * The rule's own `filter` declarations, leaving any in nested rules alone.
 */
const eachOwnFilterDecl = (
  rule: postcss.Rule,
  callback: (decl: postcss.Declaration) => void
): void => {
  rule.each(node => {
    if (node.type === 'decl' && node.prop === 'filter') {
      callback(node);
    }
  });
};

export const getFilterEffectValueForPage = (
  effectName: FilterEffect,
  css: string,
  selectors: Array<string>
): number => {
  const root = postcss.parse(css);
  const regex = getEffectRegex(effectName);

  let value = 0;
  selectors.forEach(selector => {
    const rule = findRule(root, selector);

    if (rule) {
      eachOwnFilterDecl(rule, decl => {
        const matches = decl.value.match(regex);

        if (matches?.[1]) {
          value = parseInt(matches[1]);
        }
      });
    }
  });

  return value;
};

export const getCssAfterApplyingFilterEffectToPage = (
  effectName: FilterEffect,
  css: string,
  percent: string,
  selectors: Array<string>
): string => {
  let root = postcss.parse(css);

  const regex = getEffectRegex(effectName);
  const effectValue = getEffectDeclarationValue(effectName, percent);

  selectors.forEach(selector => {
    const rule = findRule(root, selector);

    if (rule?.some(node => node.type === 'decl' && node.prop === 'filter')) {
      eachOwnFilterDecl(rule, decl => {
        const value = decl.value.replace(regex, '').trim();

        if (percent !== '0') {
          decl.value = value ? `${value} ${effectValue}` : `${effectValue}`;
        } else {
          if (value) {
            decl.value = value;
          } else {
            decl.remove();
            if (!rule.nodes?.length) {
              rule.remove();
            }
          }
        }
      });
    } else if (percent !== '0') {
      // todo: update method interfaces to avoid doing this redundant work
      root = postcss.parse(
        addDeclaration('filter', effectValue, selector, root.toString())
      );
    }
  });

  return root.toString();
};
