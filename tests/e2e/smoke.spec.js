import { test, expect } from '@playwright/test';
import { EXAMPLES } from '../../src/examples.js';

// Keep the test hermetic: the game must work with fallback fonts too.
test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
});

/** Clicks the slider near the wanted distance, then fine-tunes with the ±10 cm / ±1 cm buttons. */
async function setDistance(page, cm) {
  const slider = page.locator('#dist');
  await expect(slider).toBeEnabled();
  const box = await slider.boundingBox();
  const min = Number(await slider.getAttribute('min'));
  const max = Number(await slider.getAttribute('max'));
  const frac = (cm - min) / (max - min);
  // dir="rtl": the far end (22 m) is on the left, like in the scene
  await page.mouse.click(box.x + box.width * (1 - frac), box.y + box.height / 2);
  for (let i = 0; i < 300; i++) {
    const diff = cm - Number(await slider.inputValue());
    if (diff === 0) return;
    const step = Math.abs(diff) >= 10 ? 10 : 1;
    await page.click(`.nudge[data-step="${Math.sign(diff) * step}"]`);
  }
  throw new Error(`Could not set the slider to ${cm}`);
}

test('SPIN example played by hand ends with 11,60 m', async ({ page }) => {
  await page.goto('./?lang=cs');
  await page.getByRole('button', { name: /Nůž · spin/i }).click();
  await expect(page.locator('#scene')).toContainText('DLOUHÁ VZDÁLENOST');

  const rows = page.locator('#scene .row');
  const steps = EXAMPLES.spin.steps;
  for (const [i, step] of steps.entries()) {
    await setDistance(page, step.d);
    await expect(page.locator('#dist-value')).toHaveText(`${(step.d / 100).toFixed(2).replace('.', ',')} m`);
    await page.getByRole('button', { name: step.stuck ? 'Zasekl se ✓' : 'Nezasekl se ✗' }).click();
    await expect(rows).toHaveCount(i + 1);

    if (i === 0) {
      // invalid moves after the stick at 7,50 m are refused with an explanation
      await setDistance(page, 750);
      await expect(page.locator('#reason')).toHaveText('Musí být dál než poslední zásek (7,50 m)');
      await expect(page.locator('#btn-stuck')).toBeDisabled();
      await setDistance(page, 1320);
      await expect(page.locator('#reason')).toHaveText('Sektor nelze přeskočit, nejvýše 13 m');
      await expect(page.locator('#btn-miss')).toBeDisabled();
    }
  }

  await expect(page.locator('#summary')).toBeVisible();
  await expect(page.locator('#sum-result')).toHaveText('11,60 m');
  await expect(page.locator('#scene')).toContainText('VÝSLEDEK 11,60 M');
  await expect(page.locator('#scene')).toContainText('Výsledek: 11,60 m');
  await expect(rows).toHaveCount(7);
  await expect(page.locator('#log tbody tr')).toHaveCount(7);

  // undo goes one step back
  await page.getByRole('button', { name: 'Vrátit hod' }).click();
  await expect(rows).toHaveCount(6);
  await expect(page.locator('#summary')).toBeHidden();
  await expect(page.locator('#btn-miss')).toBeEnabled();
});

test('NO-SPIN example (English, reduced motion, phone width) ends with 7.80 m', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('./?lang=en&tool=nospin');
  await expect(page.locator('#dist')).toHaveAttribute('min', '400');
  await page.getByRole('button', { name: 'Play example' }).click();
  await expect(page.locator('#summary')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#sum-result')).toHaveText('7.80 m');
  await expect(page.locator('#scene .row')).toHaveCount(8);
  await expect(page.locator('#scene')).toContainText('RESULT 7.80 M');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test('language follows the browser and can be switched', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'sk-SK' });
  const page = await context.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await expect(page.getByRole('button', { name: /Sekera/ })).toBeVisible();
  await page.getByRole('combobox', { name: 'Jazyk' }).selectOption('en');
  await expect(page.getByRole('button', { name: /Axe/ })).toBeVisible();
  await page.getByRole('button', { name: /Axe/ }).click();
  await expect(page.getByRole('button', { name: 'Stuck ✓' })).toBeVisible();
  await context.close();
});

test('Russian on a phone: Cyrillic texts and units, no horizontal scroll', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await page.getByRole('button', { name: /Топор/ }).click();
  await expect(page.getByRole('button', { name: 'Втык ✓' })).toBeVisible();
  await expect(page.locator('#dist-value')).toHaveText(/^\d+,\d{2} м$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  await page.getByRole('combobox', { name: 'Язык' }).selectOption('fr');
  await expect(page.getByRole('button', { name: 'Plantée ✓' })).toBeVisible();
  await context.close();
});
