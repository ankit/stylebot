import type { FrameLocator } from '@playwright/test';

import { test, expect } from './fixtures';
import {
  PAGE_URL,
  getMonacoFrame,
  openEditor,
  seedStyles,
  servePage,
  switchEditorMode,
} from './helpers';

const PAGE_HTML = `
  <!doctype html>
  <html>
    <body>
      <h1>Test page</h1>
    </body>
  </html>
`;

const CSS = [
  '/* ==Stylebot==',
  '@var select theme "Theme" {"Light": "light", "Dark": "dark"}',
  '@var select code "Code font" {"Plex": "IBM Plex Mono", "Fira": "Fira Code"}',
  '==/Stylebot== */',
  '',
  'h1 {',
  '  color: rgb(255, 0, 128);',
  '}',
].join('\n');

/**
 * Start lines of the folded regions in the frame's Monaco editor.
 */
const getFoldedLines = (monaco: FrameLocator): Promise<Array<number>> =>
  monaco.locator('.monaco-editor').evaluate(async () => {
    type FoldingRegions = {
      length: number;
      isCollapsed(index: number): boolean;
      getStartLineNumber(index: number): number;
    };
    type Editor = {
      getContribution(id: string): {
        getFoldingModel(): Promise<{ regions: FoldingRegions }>;
      };
    };
    const { monaco: api } = window as unknown as {
      monaco: { editor: { getEditors(): Array<Editor> } };
    };
    const folding = api.editor
      .getEditors()[0]
      .getContribution('editor.contrib.folding');
    const { regions } = await folding.getFoldingModel();
    const folded: Array<number> = [];

    for (let index = 0; index < regions.length; index++) {
      if (regions.isCollapsed(index)) {
        folded.push(regions.getStartLineNumber(index));
      }
    }

    return folded;
  });

test('the in-page code editor opens with the style header folded, and the user can unfold it', async ({
  context,
  extension,
  openPopup,
}) => {
  test.slow();

  await servePage(context, PAGE_HTML);
  await seedStyles(extension, { localhost: { css: CSS, enabled: true } });

  const page = await context.newPage();
  await page.goto(PAGE_URL);

  const editorRoot = await openEditor(page, openPopup);
  await switchEditorMode(editorRoot, 'code');

  const monaco = getMonacoFrame(page);
  await expect.poll(() => getFoldedLines(monaco)).toEqual([1]);

  // No line numbers here, so the inline marker after the folded line opens it.
  await monaco.locator('.inline-folded').click();
  await expect.poll(() => getFoldedLines(monaco)).toEqual([]);

  await page.keyboard.press('End');
  await page.keyboard.type(' ');

  // Long enough for Monaco to recompute its ranges after the edit.
  await page.waitForTimeout(1000);
  expect(await getFoldedLines(monaco)).toEqual([]);
});

test('the options code editor opens with the style header folded', async ({
  context,
  engine,
  extension,
}) => {
  test.skip(
    !engine.opensExtensionPages,
    "Playwright can't open the options page as a page on this engine"
  );
  test.slow();

  await seedStyles(extension, { localhost: { css: CSS, enabled: true } });

  const page = await context.newPage();
  await page.goto(
    `chrome-extension://${extension.id}/options.html#/styles/edit?url=localhost`
  );

  const monaco = page.frameLocator('.stylebot-code-editor-iframe iframe');
  await expect.poll(() => getFoldedLines(monaco)).toEqual([1]);
});
