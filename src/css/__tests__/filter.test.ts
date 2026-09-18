/* eslint-disable @typescript-eslint/no-var-requires */
const dedent = require('dedent');

import { getCssAfterApplyingFilterEffectToPage } from '../filter';

describe('filter', () => {
  describe('getCssAfterApplyingFilterEffectToPage', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div class="article-body"></div>';
    });

    describe('when the effect is set to 0', () => {
      it('removes only the filter declaration, keeping sibling declarations', () => {
        const css = dedent`
          div.article-body {
            color: red;
            filter: grayscale(100%);
          }
        `;

        const output = getCssAfterApplyingFilterEffectToPage(
          'grayscale',
          css,
          '0'
        );

        expect(output).toBe(dedent`
          div.article-body {
            color: red;
          }
        `);
      });

      it('removes the rule when the filter declaration was its only one', () => {
        const css = dedent`
          div.article-body {
            filter: grayscale(100%);
          }
        `;

        const output = getCssAfterApplyingFilterEffectToPage(
          'grayscale',
          css,
          '0'
        );

        expect(output).toBe('');
      });

      it('keeps other effects in the same filter value', () => {
        const css = dedent`
          div.article-body {
            filter: invert(100%) grayscale(80%);
          }
        `;

        const output = getCssAfterApplyingFilterEffectToPage(
          'grayscale',
          css,
          '0'
        );

        expect(output).toBe(dedent`
          div.article-body {
            filter: invert(100%);
          }
        `);
      });
    });

    describe('when the effect is set to a non-zero value', () => {
      it('adds the filter declaration to an existing rule', () => {
        const css = dedent`
          div.article-body {
            color: red;
          }
        `;

        const output = getCssAfterApplyingFilterEffectToPage(
          'grayscale',
          css,
          '50'
        );

        expect(output).toBe(dedent`
          div.article-body {
            color: red;
            filter: grayscale(50%);
          }
        `);
      });

      it('updates the filter declaration when it is already present', () => {
        const css = dedent`
          div.article-body {
            color: red;
            filter: grayscale(20%);
          }
        `;

        const output = getCssAfterApplyingFilterEffectToPage(
          'grayscale',
          css,
          '50'
        );

        expect(output).toBe(dedent`
          div.article-body {
            color: red;
            filter: grayscale(50%);
          }
        `);
      });
    });
  });
});
