import { test, expect } from './fixtures';

test('arrow keys and the breadcrumb navigate ancestors while picking an element', async ({
  context,
  openPopup,
}) => {
  const page = await context.newPage();
  page.on('pageerror', err => console.log('PAGEERROR', err));
  page.on('console', msg => console.log('CONSOLE', msg.type(), msg.text()));
  await page.goto('https://example.com');
  await page.bringToFront();

  const popup = await openPopup();
  await popup
    .getByRole('button', { name: /^Style this page/ })
    .dispatchEvent('click');
  await expect(page.locator('#stylebot')).toBeAttached();

  const inspectorButton = page.locator('.stylebot-inspector');
  const currentCrumb = page.locator('.crumb.current');
  const selectorInput = page.locator('.css-selector-input');
  const pageLink = page.getByRole('link', { name: 'Learn more' });

  console.log('disabled attr', await inspectorButton.getAttribute('disabled'));
  await inspectorButton.dispatchEvent('click');
  console.log('class after click', await inspectorButton.getAttribute('class'));
  await page.waitForTimeout(200);
  console.log('class after wait', await inspectorButton.getAttribute('class'));
  await expect(inspectorButton).toHaveClass(/active/);
  await pageLink.hover();
  await page.waitForTimeout(300);
  console.log(
    'breadcrumb count',
    await page.locator('.inspector-breadcrumb').count()
  );
  console.log('crumb count', await page.locator('.crumb').count());
  console.log('crumb texts', await page.locator('.crumb').allTextContents());

  // Hovering the page's only <a> highlights it and renders its ancestor chain.
  await expect(currentCrumb).toHaveText('a');
  await expect(page.locator('.crumb').first()).toHaveText('html');

  await page.keyboard.press('ArrowUp');
  await expect(currentCrumb).not.toHaveText('a');
  const parentLabel = await currentCrumb.textContent();

  await page.keyboard.press('Enter');

  // Selecting stops inspecting and applies the ancestor's selector, not the <a>'s.
  await expect(inspectorButton).not.toHaveClass(/active/);
  await expect(selectorInput).not.toHaveValue('a');
  const selectorAfterArrowUp = await selectorInput.inputValue();
  expect(selectorAfterArrowUp).toBeTruthy();

  // Re-enter picking mode and jump straight to the root via a breadcrumb click.
  await inspectorButton.click();
  await pageLink.hover();
  await expect(currentCrumb).toHaveText('a');

  await page.locator('.crumb', { hasText: 'html' }).click();

  // A crumb click navigates only — it shouldn't finalize the selection or close the picker.
  await expect(currentCrumb).toHaveText('html');
  await expect(inspectorButton).toHaveClass(/active/);

  await page.keyboard.press('Enter');
  await expect(selectorInput).toHaveValue('html');
});
