import * as postcss from 'postcss';

import { addDeclaration } from '@stylebot/css';

import { FilterEffect } from '@stylebot/types';

const getEffectRegex = (name: FilterEffect) => new RegExp(`${name}\\((.*)\\)$`);
const getEffectDeclarationValue = (name: FilterEffect, percent: string) =>
  `${name}(${percent}%)`;

export const getFilterEffectValueForPage = (
  effectName: FilterEffect,
  css: string,
  selectors: Array<string>
): number => {
  const root = postcss.parse(css);
  const regex = getEffectRegex(effectName);

  let value = 0;
  selectors.forEach(selector => {
    if (root.some(node => node.type === 'rule' && node.selector === selector)) {
      root.walkRules(selector, rule => {
        rule.walkDecls('filter', (decl: postcss.Declaration) => {
          const matches = decl.value.match(regex);

          if (matches?.[1]) {
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
  percent: string,
  selectors: Array<string>
): string => {
  let root = postcss.parse(css);

  const regex = getEffectRegex(effectName);
  const effectValue = getEffectDeclarationValue(effectName, percent);

  selectors.forEach(selector => {
    if (root.some(node => node.type === 'rule' && node.selector === selector)) {
      root.walkRules(selector, rule => {
        if (rule.some(node => node.type === 'decl' && node.prop === 'filter')) {
          rule.walkDecls('filter', (decl: postcss.Declaration) => {
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
    } else if (percent !== '0') {
      // todo: update method interfaces to avoid doing this redundant work
      root = postcss.parse(
        addDeclaration('filter', effectValue, selector, root.toString())
      );
    }
  });

  return root.toString();
};
