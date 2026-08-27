import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const timestamp = Date.now();
const TEST_EMAIL = `facets${timestamp}@test.com`;
const TEST_NAME = 'Facet Tester';
const TEST_PASSWORD = 'TestPass123!';
const API_BASE = 'http://localhost:5000/api';
const TEST_SECRET = 'test-helper-viranikosh';

/**
 * Mock Gemini AI responses at the browser network level (defense-in-depth) —
 * same pattern as viranikosh-flow.spec.ts.
 */
function mockAIEndpoints(page: Page) {
  page.on('route', async (route) => {
    const url = route.request().url();
    if (
      url.includes('generativelanguage.googleapis.com') ||
      url.includes('/v1beta/models/')
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: { parts: [{ text: '{}' }], role: 'model' },
            finishReason: 'STOP',
            index: 0,
          }],
          usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
        }),
      });
      return;
    }
    await route.fallback();
  });
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign in")');
  await expect(page).toHaveURL(/\/home/, { timeout: 15000 });
}

/** The quick-browse facet tabs live in the bordered tab row (sidebar has
 * chips with colliding labels like "Festival", so scope to this row only). */
async function clickFacet(page: Page, name: string) {
  await page
    .locator('div.mt-5.flex.border-b.border-sand-lighter.pb-4')
    .getByRole('button', { name, exact: true })
    .click();
}

/** Wait until the results counter shows exactly `n` cultural records. */
async function expectCount(page: Page, n: number) {
  const text = `${n} cultural ${n === 1 ? 'record' : 'records'}`;
  await expect(page.locator('p').filter({ hasText: /cultural record/ })).toContainText(text, { timeout: 15000 });
}

/** Click an option chip inside the quick-browse scroll row (resets excluded). */
async function clickOptionChip(page: Page, label: string) {
  await page.locator('.vk-scroll-x').getByRole('button', { name: label, exact: true }).click();
}

/** Click the "All <label>s" reset chip inside the quick-browse scroll row. */
async function clickResetChip(page: Page, label: string) {
  await page.locator('.vk-scroll-x').getByRole('button', { name: label, exact: true }).click();
}

test.describe.serial('Explore facet filters', () => {
  let testUserId: string | null = null;

  test.beforeEach(async ({ page }) => {
    mockAIEndpoints(page);
  });

  test('facet filters narrow the rich browse feed', async ({ page, request }) => {
    // Register a throwaway user via API, then log in through the UI.
    const reg = await request.post(`${API_BASE}/auth/register`, {
      data: { name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(reg.ok()).toBeTruthy();
    const regBody = await reg.json();
    testUserId = regBody.data.user.id;

    // SPA-nav to /explore AFTER login (full reload would lose auth state).
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await page.getByRole('link', { name: 'Explore' }).first().click();
    await expect(page).toHaveURL(/\/explore/, { timeout: 15000 });
    await expectCount(page, 107);

    // Category facet (default, already verified) — sanity baseline.
    await clickOptionChip(page, 'Folk Song');
    await expectCount(page, 19);
    await clickResetChip(page, 'All categorys');
    await expectCount(page, 107);

    // Art form
    await clickFacet(page, 'Art form');
    await clickOptionChip(page, 'Warli painting');
    await expectCount(page, 4);
    await clickResetChip(page, 'All art forms');
    await expectCount(page, 107);

    // Festival
    await clickFacet(page, 'Festival');
    await clickOptionChip(page, 'Chhath');
    await expectCount(page, 1);
    await clickResetChip(page, 'All festivals');
    await expectCount(page, 107);

    // Language
    await clickFacet(page, 'Language');
    await clickOptionChip(page, 'Maithili');
    await expectCount(page, 5);
    await clickResetChip(page, 'All languages');
    await expectCount(page, 107);

    // Region
    await clickFacet(page, 'Region');
    await clickOptionChip(page, 'Mithila, Bihar');
    await expectCount(page, 9);

    // Sanity: a filtered view actually renders cards.
    await expect(page.locator('article span[class*="tracking-wider"]').first()).toBeVisible();
  });

  test.afterAll(async ({ request }) => {
    try {
      if (testUserId) {
        await request.post(`${API_BASE}/auth/test/delete-user`, {
          headers: { 'x-test-secret': TEST_SECRET },
          data: { userId: testUserId },
        });
      }
    } catch { /* best-effort cleanup */ }
  });
});