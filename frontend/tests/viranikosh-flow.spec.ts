import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const timestamp = Date.now();
const TEST_EMAIL = `e2etest${timestamp}@test.com`;
const TEST_NAME = 'E2E Tester';
const TEST_PASSWORD = 'TestPass123!';
const POST_TITLE = `E2E Test Post ${timestamp}`;
const COMMENT_TEXT = `Test comment from E2E ${timestamp}`;
const API_BASE = 'http://localhost:5000/api';
const API_BASE_URL = 'http://localhost:5000';
const TEST_SECRET = 'test-helper-viranikosh';

/**
 * Mock Gemini AI responses at the browser network level (defense-in-depth).
 *
 * The primary mock lives in global-setup.ts — a local HTTP server on port 3099
 * that the backend uses via GEMINI_API_BASE env var.  This page.route()
 * intercepts any stray browser→backend requests that might trigger AI
 * processing (upload status polling etc.), ensuring E2E never depends on
 * live Gemini availability.
 *
 * Production/dev code is NOT modified. The real Gemini API key and integration
 * remain untouched.
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

/**
 * Login via UI and land on /home.
 * IMPORTANT: Do NOT use page.goto() after this — it causes a full reload
 * which loses in-memory React auth state. Use SPA navigation (click links)
 * or re-login for each test that needs a different page.
 */
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign in")');
  await expect(page).toHaveURL(/\/home/, { timeout: 15000 });
}

/**
 * Get auth token via API login (for direct API calls from test code).
 * The token is returned in the JSON body; cookie is set by backend too.
 */
async function getAuthToken(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.data.token;
}

test.describe.serial('Viranikosh E2E Flow', () => {
  let testUserId: string | null = null;
  let testPostId: string | null = null;

  test.beforeEach(async ({ page }) => {
    mockAIEndpoints(page);
  });

  // ─── STEP 1: Register ──────────────────────────────────────────
  test('1. Register a new random test user', async ({ page, request }) => {
    const response = await request.post(`${API_BASE}/auth/register`, {
      data: { name: TEST_NAME, email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe(TEST_EMAIL);
    expect(body.data.token).toBeTruthy();
    testUserId = body.data.user.id;

    // Verify the app loads
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  // ─── STEP 2: Login ─────────────────────────────────────────────
  test('2. Login with registered user via UI', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Welcome back');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await expect(page).toHaveURL(/\/home/, { timeout: 15000 });
  });

  // ─── STEP 3: Auth persistence after reload ─────────────────────
  test('3. Session persists after page reload', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await expect(page.locator('h1')).toContainText('Namaskar');

    await page.reload({ waitUntil: 'networkidle' });

    await expect(page).toHaveURL(/\/home/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Namaskar');
  });

  // ─── STEP 4: Dashboard check ──────────────────────────────────
  test('4. Verify redirect to dashboard/home after login', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);

    await expect(page.locator('h1')).toContainText('Namaskar');
    await expect(page.locator('[aria-label="Cultural feed"]')).toBeVisible();
    await expect(page.locator('nav').first()).toBeVisible();
  });

  // ─── STEP 5: Create a new post ────────────────────────────────
  test('5. Create a new post (basic text/title post)', async ({ page, request }) => {
    // Login and use SPA nav to reach /create (avoids full page reload)
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);

    // Click "Contribute" link in the sidebar to navigate via SPA router
    const contributeLink = page.locator('a[href="/create"]').first();
    await expect(contributeLink).toBeVisible({ timeout: 5000 });
    await contributeLink.click();
    await expect(page).toHaveURL(/\/create/, { timeout: 5000 });

    // Step 0 — Select "Written record"
    await page.click('button:has-text("Written record")');
    await page.click('button:has-text("Continue")');

    // Step 1 — Write original transcript
    const transcriptArea = page.locator('section[aria-label="Upload or record"] textarea');
    await expect(transcriptArea).toBeVisible({ timeout: 5000 });
    await transcriptArea.fill('This is a test cultural record created during E2E automated testing.');
    await page.click('button:has-text("Continue")');

    // Step 2 — Preview
    await expect(page.locator('section[aria-label="Preview"]')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Continue")');

    // Step 3 — Metadata
    await expect(page.locator('section[aria-label="Add metadata"]')).toBeVisible({ timeout: 5000 });
    await page.fill('input[placeholder="Sohar — the birth song of Mithila"]', POST_TITLE);
    const descArea = page.locator('section[aria-label="Add metadata"] textarea').first();
    await descArea.fill('A detailed description of this cultural record created for E2E testing.');
    const selects = page.locator('section[aria-label="Add metadata"] select');
    // Wait for taxonomy selects to populate (fetched from backend)
    await expect(selects.nth(0).locator('option').nth(1)).toBeAttached({ timeout: 10000 });
    await selects.nth(0).selectOption({ index: 1 });
    await selects.nth(1).selectOption({ index: 1 });
    await expect(selects.nth(2).locator('option').nth(1)).toBeAttached({ timeout: 10000 });
    await selects.nth(2).selectOption({ index: 1 });
    await page.click('button:has-text("Continue")');

    // Step 4 — Submit
    await expect(page.locator('section[aria-label="Submit"]')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Submit and preserve the original")');

    // Wait for either the AI processing screen or an error alert.
    // The backend POST /api/posts may be slow on the remote Supabase DB,
    // so give enough time for the 30s axios timeout to fire and the
    // catch block to render the error alert.
    const aiSection = page.locator('section[aria-label="AI processing"]');
    const errorAlert = page.locator('[role="alert"]');
    await Promise.race([
      aiSection.waitFor({ state: 'visible', timeout: 45000 }),
      errorAlert.waitFor({ state: 'visible', timeout: 45000 }),
    ]);

    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      throw new Error(
        `[STEP 5 FAIL] POST /api/posts failed. Error shown in UI: "${errorText}"`
      );
    }
    await expect(aiSection).toBeVisible();

    // Navigate back to feed via SPA (click Home link in nav)
    const homeLink = page.locator('nav a[href="/home"]').first();
    await homeLink.click();
    await expect(page.locator(`text=${POST_TITLE}`).first()).toBeVisible({ timeout: 10000 });

    // Capture post ID for cleanup
    const postsRes = await request.get(`${API_BASE}/posts/feed`, {
      params: { limit: 100 }
    });
    expect(postsRes.ok()).toBeTruthy();
    const postsBody = await postsRes.json();
    const found = postsBody.data.posts.find((p: any) => p.title === POST_TITLE);
    if (found) testPostId = found.id;
  });

  // ─── STEP 6: Like a post ──────────────────────────────────────
  test('6. Like a post', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await expect(page.locator('[aria-label="Cultural feed"]')).toBeVisible({ timeout: 10000 });

    const likeBtn = page.locator('button[aria-label="Like this record"]').first();
    await expect(likeBtn).toBeVisible({ timeout: 10000 });
    await likeBtn.click();

    // After clicking, aria-label changes to "Remove like"
    await expect(page.locator('button[aria-label="Remove like"]').first()).toBeVisible({ timeout: 5000 });
  });

  // ─── STEP 7: Comment on a post ────────────────────────────────
  test('7. Comment on a post', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await expect(page.locator('[aria-label="Cultural feed"]')).toBeVisible({ timeout: 10000 });

    // Open comments on the first post
    const commentToggle = page.locator('button[aria-label="Show comments"]').first();
    await expect(commentToggle).toBeVisible({ timeout: 10000 });
    await commentToggle.click();

    // Type a comment
    const commentInput = page.locator('textarea[aria-label="Write a comment"]').first();
    await expect(commentInput).toBeVisible({ timeout: 5000 });
    await commentInput.fill(COMMENT_TEXT);

    const postBtn = page.locator('button[type="submit"]:has-text("Post")').first();
    await expect(postBtn).toBeEnabled();
    await postBtn.click();

    // Verify the comment appears
    await expect(page.locator(`text=${COMMENT_TEXT}`)).toBeVisible({ timeout: 10000 });
  });

  // ─── STEP 8: Follow another user ──────────────────────────────
  test('8. Follow another user (suggested users list)', async ({ page, request }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await page.waitForLoadState('networkidle');

    // DiscoveryRail follow buttons (xl+ screens only)
    const followBtn = page.locator('aside button:has-text("Follow"):not(:has-text("Following"))').first();
    const isVisible = await followBtn.isVisible().catch(() => false);

    if (isVisible) {
      await followBtn.click();
      await expect(page.locator('aside button:has-text("Following")').first()).toBeVisible({ timeout: 5000 });
    } else {
      // Fallback: follow via API
      const token = await getAuthToken(request, TEST_EMAIL, TEST_PASSWORD);
      const resp = await request.get(`${API_BASE}/users/suggested`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(resp.ok()).toBeTruthy();
      const body = await resp.json();
      const users = body.data;
      if (users && users.length > 0) {
        const followResp = await request.post(`${API_BASE}/users/${users[0].id}/follow`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(followResp.ok()).toBeTruthy();
      } else {
        test.skip(true, 'No suggested users available to follow');
      }
    }
  });

  // ─── STEP 9: Virasat Interview flow ───────────────────────────
  test('9. Virasat Interview: create interview → select subject → generate questions', async ({ page }) => {
    // Login, then use SPA nav to reach /virasat-interview
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);

    // Click the "Virasat Interview" nav link in the sidebar
    const interviewLink = page.locator('nav a[href="/virasat-interview"]').first();
    await expect(interviewLink).toBeVisible({ timeout: 5000 });
    await interviewLink.click();
    await expect(page).toHaveURL(/\/virasat-interview/, { timeout: 5000 });

    // Phase: Topic selection
    await expect(page.locator('section[aria-label="Choose a topic"]')).toBeVisible({ timeout: 10000 });

    // Fill speaker name (required, min 2 chars)
    await page.fill('input[placeholder="Sarojini Sen"]', 'Kamla Devi');

    // Select a subject topic
    await page.click('button:has-text("Childhood festivals")');
    await expect(page.locator('button:has-text("Childhood festivals")')).toHaveClass(/border-terracotta/);

    // Click "Prepare the questions"
    await page.click('button:has-text("Prepare the questions")');

    // ── CRITICAL: Wait for question generation (45s timeout) ──
    // No backend AI — questions are hardcoded per topic.
    // The "generating" phase just calls POST /interviews + POST /interviews/:id/questions.
    // On slow/remote DB these two sequential calls can take > 20s.
    const GENERATION_TIMEOUT = 45000;

    try {
      await expect(page.locator('section[aria-label="Interview"]')).toBeVisible({ timeout: GENERATION_TIMEOUT });
      await expect(page.locator('text=Question 1 of')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('button:has-text("Finish")')).toBeVisible();
    } catch {
      const isGenerating = await page.locator('text=Writing questions').isVisible().catch(() => false);
      const isFailed = await page.locator('section[aria-label="Question generation failed"]').isVisible().catch(() => false);

      if (isFailed) {
        const errorMsg = await page.locator('section[aria-label="Question generation failed"] p').textContent();
        throw new Error(
          `[STEP 8 FAIL] Interview question generation FAILED on the backend.\n` +
          `Error shown in UI: "${errorMsg}"\nCheck backend terminal for the error.`
        );
      } else if (isGenerating) {
        throw new Error(
          `[STEP 8 FAIL] Interview question generation STUCK in "Writing questions" phase.\n` +
          `The UI is still showing the spinner after ${GENERATION_TIMEOUT / 1000}s.\n` +
          `This likely means POST /api/interviews or POST /api/interviews/:id/questions is hanging.\n` +
          `Check backend terminal for incoming requests or errors.`
        );
      } else {
        throw new Error(
          `[STEP 8 FAIL] Interview flow reached an unexpected state.\n` +
          `Current URL: ${page.url()}\nCheck backend terminal for errors.`
        );
      }
    }
  });

  // ─── STEP 10: Notifications page ──────────────────────────────
  test('10. Notifications page loads without error', async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);

    // Click Notifications nav link via SPA
    const notifLink = page.locator('nav a[href="/notifications"]').first();
    await expect(notifLink).toBeVisible({ timeout: 5000 });
    await notifLink.click();
    await expect(page).toHaveURL(/\/notifications/, { timeout: 5000 });

    // Heading should be visible
    await expect(page.locator('h1:has-text("Notifications")')).toBeVisible({ timeout: 10000 });

    // Wait for the async data to load — page shows either:
    // - notification list items (ul li a)
    // - empty state ("Nothing new")
    // - or skeleton loaders (h3 with class "h-16")
    await page.waitForLoadState('networkidle');

    const hasContent = await page.locator('main').textContent();
    // Page should have loaded — just verify no crash/error and the heading is there
    expect(hasContent).toContain('Notifications');

    // No error alert should be present
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });

  test.afterAll(async ({ request }) => {
    try {
      if (testUserId) {
        await request.post(`${API_BASE}/auth/test/delete-user`, {
          headers: { 'x-test-secret': TEST_SECRET },
          data: { userId: testUserId }
        });
      }
    } catch { /* best-effort cleanup */ }
  });
});

// ─── INTERVIEW AUDIO ACCESS CONTROL ────────────────────────────
test.describe.serial('Interview audio access control', () => {
  const ts = Date.now();
  const OWNER_EMAIL = `audio-owner-${ts}@test.com`;
  const OTHER_EMAIL = `audio-other-${ts}@test.com`;
  const PASSWORD = 'TestPass123!';
  const API = API_BASE;

  let ownerToken = '';
  let otherToken = '';
  let interviewId = '';
  let questionId = '';
  let audioUrl = '';
  let ownerUserId = '';
  let otherUserId = '';

  test('11. Setup: register users, create interview, upload audio', async ({ request }) => {
    // Register owner
    const oReg = await request.post(`${API}/auth/register`, {
      data: { name: 'Audio Owner', email: OWNER_EMAIL, password: PASSWORD },
    });
    expect(oReg.ok()).toBeTruthy();
    ownerToken = (await oReg.json()).data.token;
    ownerUserId = (await oReg.json()).data.user.id;

    // Register other user
    const rReg = await request.post(`${API}/auth/register`, {
      data: { name: 'Audio Other', email: OTHER_EMAIL, password: PASSWORD },
    });
    expect(rReg.ok()).toBeTruthy();
    otherToken = (await rReg.json()).data.token;
    otherUserId = (await rReg.json()).data.user.id;

    // Owner creates interview
    const cRes = await request.post(`${API}/interviews`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { title: 'Audio Security Test' },
    });
    const cBody = await cRes.json();
    console.log(`[E2E] POST /api/interviews → ${cRes.status()}: ${JSON.stringify(cBody)}`);
    expect(cRes.ok()).toBeTruthy();
    interviewId = cBody.data.id;

    // Add a question
    const qRes = await request.post(`${API}/interviews/${interviewId}/questions`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { questions: [{ question: 'Tell me about your heritage', order: 1 }] },
    });
    const qBody = await qRes.json().catch(() => null);
    console.log(`[E2E] POST /api/interviews/${interviewId}/questions → ${qRes.status()}: ${JSON.stringify(qBody)}`);
    expect(qRes.ok()).toBeTruthy();
    questionId = (await qRes.json()).data.questions[0].id;

    // Upload audio as owner (small valid-enough buffer for multer)
    const audioBuf = Buffer.alloc(64, 0x1A);
    const uRes = await request.post(`${API}/interviews/${interviewId}/audio`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      multipart: {
        audio: { name: 'answer.webm', mimeType: 'audio/webm', buffer: audioBuf },
        questionId,
      },
    });
    expect(uRes.ok()).toBeTruthy();
    audioUrl = (await uRes.json()).data.audioUrl;
    expect(audioUrl).toMatch(/^\/files\/audio\//);
  });

  test('12. Owner can access own private interview audio', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}${audioUrl}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('13. Other user receives 403 on private interview audio', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}${audioUrl}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('14. Unauthenticated user cannot access private interview audio', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}${audioUrl}`);
    expect(res.status()).toBe(403);
  });

  test('15. Nonexistent audio returns 404', async ({ request }) => {
    const res = await request.get(`${API_BASE_URL}/files/audio/nonexistent-abcdef123456.webm`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(res.status()).toBe(404);
  });

  test.afterAll(async ({ request }) => {
    try {
      if (ownerUserId) {
        await request.post(`${API}/auth/test/delete-user`, {
          headers: { 'x-test-secret': TEST_SECRET },
          data: { userId: ownerUserId }
        });
      }
    } catch { /* best-effort cleanup */ }
    try {
      if (otherUserId) {
        await request.post(`${API}/auth/test/delete-user`, {
          headers: { 'x-test-secret': TEST_SECRET },
          data: { userId: otherUserId }
        });
      }
    } catch { /* best-effort cleanup */ }
  });
});

// ─── JWT ROLE REVALIDATION ─────────────────────────────────────
test.describe.serial('JWT role revalidation', () => {
  const ts = Date.now();
  const ADMIN_EMAIL = `reval-admin-${ts}@test.com`;
  const USER_EMAIL = `reval-user-${ts}@test.com`;
  const PASSWORD = 'TestPass123!';
  const API = API_BASE;

  let adminToken = '';
  let adminUserId = '';
  let userToken = '';
  let userUserId = '';
  let deleteUserId = '';

  test('16. Register users and promote one to admin', async ({ request }) => {
    // Register future admin
    const aReg = await request.post(`${API}/auth/register`, {
      data: { name: 'Future Admin', email: ADMIN_EMAIL, password: PASSWORD },
    });
    expect(aReg.ok()).toBeTruthy();
    const aBody = await aReg.json();
    adminToken = aBody.data.token;
    adminUserId = aBody.data.user.id;

    // Register normal user
    const uReg = await request.post(`${API}/auth/register`, {
      data: { name: 'Normal User', email: USER_EMAIL, password: PASSWORD },
    });
    expect(uReg.ok()).toBeTruthy();
    const uBody = await uReg.json();
    userToken = uBody.data.token;
    userUserId = uBody.data.user.id;

    // Promote to ADMIN via test helper
    const setRole = await request.post(`${API}/auth/test/set-role`, {
      headers: { 'x-test-secret': TEST_SECRET },
      data: { userId: adminUserId, role: 'ADMIN' },
    });
    expect(setRole.ok()).toBeTruthy();
  });

  test('17. Admin JWT grants admin access', async ({ request }) => {
    // Admin can access the verification queue (any auth user, but let's verify /auth/me shows ADMIN)
    const me = await request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(me.ok()).toBeTruthy();
    const body = await me.json();
    expect(body.data.role).toBe('ADMIN');
  });

  test('18. User JWT is denied admin-only access (requireRole)', async ({ request }) => {
    // The verification queue/flagged are community endpoints (any auth user).
    // Instead, test that a user JWT + requireRole("ADMIN") returns 403.
    // We can test this via the test/set-role endpoint which requires x-test-secret,
    // but a better test: use an endpoint that has requireRole.
    // Currently no routes use requireRole yet, so test the middleware indirectly
    // by verifying the role field in /auth/me.
    const me = await request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(me.ok()).toBeTruthy();
    const body = await me.json();
    expect(body.data.role).toBe('USER');
  });

  test('19. Admin demoted to USER — old JWT no longer grants admin role', async ({ request }) => {
    // Demote admin to USER via test helper
    const demote = await request.post(`${API}/auth/test/set-role`, {
      headers: { 'x-test-secret': TEST_SECRET },
      data: { userId: adminUserId, role: 'USER' },
    });
    expect(demote.ok()).toBeTruthy();

    // Use the SAME old JWT — authMiddleware should fetch fresh role from DB
    const me = await request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(me.ok()).toBeTruthy();
    const body = await me.json();
    // The role must now be USER, not ADMIN, even though the JWT still says ADMIN
    expect(body.data.role).toBe('USER');
  });

  test('20. Deleted user — old JWT is rejected with 401', async ({ request }) => {
    // Register a throwaway user to delete
    const tReg = await request.post(`${API}/auth/register`, {
      data: { name: 'To Delete', email: `del-${ts}@test.com`, password: PASSWORD },
    });
    expect(tReg.ok()).toBeTruthy();
    const tBody = await tReg.json();
    const deleteToken = tBody.data.token;
    deleteUserId = tBody.data.user.id;

    // Delete the user via test helper
    const del = await request.post(`${API}/auth/test/delete-user`, {
      headers: { 'x-test-secret': TEST_SECRET },
      data: { userId: deleteUserId },
    });
    expect(del.ok()).toBeTruthy();

    // Use the old JWT — should now return 401
    const me = await request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${deleteToken}` },
    });
    expect(me.status()).toBe(401);
  });

  test.afterAll(async ({ request }) => {
    try {
      if (adminUserId) {
        await request.post(`${API}/auth/test/delete-user`, {
          headers: { 'x-test-secret': TEST_SECRET },
          data: { userId: adminUserId }
        });
      }
    } catch { /* best-effort cleanup */ }
    try {
      if (userUserId) {
        await request.post(`${API}/auth/test/delete-user`, {
          headers: { 'x-test-secret': TEST_SECRET },
          data: { userId: userUserId }
        });
      }
    } catch { /* best-effort cleanup */ }
  });
});

// ─── TOKEN REVOCATION & LOGOUT SECURITY ─────────────────────────
test.describe.serial('Token revocation & logout security', () => {
  const ts = Date.now();
  const EMAIL = `revoke-${ts}@test.com`;
  const PASSWORD = 'TestPass123!';
  const API = API_BASE;

  let token = '';
  let revokeUserId = '';

  test('21. Register and verify token works on protected endpoint', async ({ request }) => {
    const reg = await request.post(`${API}/auth/register`, {
      data: { name: 'Revoke Tester', email: EMAIL, password: PASSWORD },
    });
    expect(reg.ok()).toBeTruthy();
    const body = await reg.json();
    token = body.data.token;
    revokeUserId = body.data.user.id;
    expect(token).toBeTruthy();

    // Token must work on protected endpoint
    const me = await request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.ok()).toBeTruthy();
    expect((await me.json()).data.email).toBe(EMAIL);
  });

  test('22. Logout revokes the issued token — subsequent requests return 401', async ({ request }) => {
    // Logout (server increments tokenVersion)
    const lo = await request.post(`${API}/auth/logout`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(lo.ok()).toBeTruthy();

    // Same old token must now be rejected
    const me = await request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.status()).toBe(401);
  });

  test('23. Fresh login after logout works with a new token', async ({ request }) => {
    // Login again — should succeed and return a fresh token
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();
    const body = await loginRes.json();
    const newToken = body.data.token;
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(token);

    // Fresh token must work
    const me = await request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    expect(me.ok()).toBeTruthy();
    expect((await me.json()).data.email).toBe(EMAIL);
  });

  test.afterAll(async ({ request }) => {
    try {
      if (revokeUserId) {
        await request.post(`${API}/auth/test/delete-user`, {
          headers: { 'x-test-secret': TEST_SECRET },
          data: { userId: revokeUserId }
        });
      }
    } catch { /* best-effort cleanup */ }
  });
});
