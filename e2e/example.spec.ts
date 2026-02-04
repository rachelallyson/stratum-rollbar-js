import { test, expect } from "@playwright/test";

test.describe("Stratum Rollbar Example", () => {
  test("loads the app and shows heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Stratum Rollbar Example" })).toBeVisible();
  });

  test("shows status section with Rollbar availability and last action", async ({ page }) => {
    await page.goto("/");
    const rollbarStatus = page.getByTestId("rollbar-status");
    await expect(rollbarStatus).toBeVisible();
    await expect(rollbarStatus).toContainText(/Rollbar:/);

    const lastAction = page.getByTestId("last-action");
    await expect(lastAction).toBeVisible({ timeout: 10000 });
    await expect(lastAction).toContainText(/LOADED sent|LOADED failed/);

    await expect(rollbarStatus).not.toContainText("Checking…", { timeout: 5000 });
    await expect(rollbarStatus).toContainText(/Available|Not available/);
  });

  test("shows Login as Anonymous when not logged in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("login-status")).toContainText("Anonymous");
    await expect(page.getByTestId("btn-login")).toBeVisible();
  });

  test("Track event button updates last action to BUTTON_CLICK sent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("last-action")).toContainText(/LOADED/, { timeout: 8000 });
    await page.getByTestId("btn-track-event").click();
    await expect(page.getByTestId("last-action")).toContainText("BUTTON_CLICK sent", {
      timeout: 5000,
    });
  });

  test("Send error button updates last action to GENERIC_ERROR sent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("last-action")).toContainText(/LOADED/, { timeout: 8000 });
    await page.getByTestId("btn-send-error").click();
    await expect(page.getByTestId("last-action")).toContainText("GENERIC_ERROR sent", {
      timeout: 5000,
    });
  });

  test("Send error with stack updates last action", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("last-action")).toContainText(/LOADED/, { timeout: 8000 });
    await page.getByTestId("btn-send-error-stack").click();
    await expect(page.getByTestId("last-action")).toContainText("GENERIC_ERROR", {
      timeout: 5000,
    });
  });

  test("Send warning button updates last action to RATE_LIMIT_WARNING sent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("last-action")).toContainText(/LOADED/, { timeout: 8000 });
    await page.getByTestId("btn-send-warning").click();
    await expect(page.getByTestId("last-action")).toContainText("RATE_LIMIT_WARNING sent", {
      timeout: 5000,
    });
  });

  test("Send debug button updates last action to DEBUG_ACTION sent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("last-action")).toContainText(/LOADED/, { timeout: 8000 });
    await page.getByTestId("btn-send-debug").click();
    await expect(page.getByTestId("last-action")).toContainText("DEBUG_ACTION sent", {
      timeout: 5000,
    });
  });

  test("Login shows Logged in and user info; Logout shows Anonymous", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("login-status")).toContainText("Anonymous");
    await page.getByTestId("btn-login").click();
    await expect(page.getByTestId("login-status")).toContainText("Logged in", { timeout: 5000 });
    await expect(page.getByTestId("user-info")).toBeVisible();
    await expect(page.getByTestId("user-info")).toContainText("John Doe");
    await expect(page.getByTestId("user-info")).toContainText("user@example.com");
    await expect(page.getByTestId("btn-logout")).toBeVisible();
    await page.getByTestId("btn-logout").click();
    await expect(page.getByTestId("login-status")).toContainText("Anonymous", { timeout: 5000 });
    await expect(page.getByTestId("btn-login")).toBeVisible();
  });

  test("either shows placeholder token banner or Rollbar Available", async ({ page }) => {
    await page.goto("/");
    const rollbarStatus = page.getByTestId("rollbar-status");
    await expect(rollbarStatus).not.toContainText("Checking…", { timeout: 10000 });
    const placeholderBanner = page.getByTestId("placeholder-token-banner");
    const hasPlaceholder = (await placeholderBanner.count()) > 0;
    const statusText = await rollbarStatus.textContent();
    if (hasPlaceholder) {
      expect(statusText).toMatch(/Not available|Available/);
    } else {
      expect(statusText).toContain("Available");
    }
  });

  test("sends event payload to Rollbar API and server accepts it", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("last-action")).toContainText(/LOADED/, { timeout: 8000 });
    await expect(page.getByTestId("rollbar-status")).toContainText("Available", {
      timeout: 5000,
    });

    const rollbarItemUrl = /api\.rollbar\.com\/api\/1\/item/;
    const responsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        rollbarItemUrl.test(res.url()) &&
        res.status() === 200,
      { timeout: 15000 }
    );
    const requestPromise = page.waitForRequest(
      (req) => req.method() === "POST" && rollbarItemUrl.test(req.url()),
      { timeout: 15000 }
    );
    await page.getByTestId("btn-track-event").click();
    const [response, request] = await Promise.all([responsePromise, requestPromise]);

    expect(response.status()).toBe(200);
    const responseBody = await response.json().catch(() => ({})) as {
      err?: number;
      result?: { uuid?: string };
    };
    expect(responseBody.err).toBe(0);
    expect(responseBody.result).toBeDefined();
    expect(responseBody.result!.uuid).toBeDefined();
    expect(typeof responseBody.result!.uuid).toBe("string");

    expect(request.url()).toMatch(rollbarItemUrl);
    const postData = request.postData();
    expect(postData).toBeTruthy();
    const payload = JSON.parse(postData!) as { data?: Record<string, unknown> };
    const data = payload.data;
    expect(data).toBeDefined();
    const body = data!.body as Record<string, unknown> | undefined;
    expect(body).toBeDefined();
    const message = body!.message as Record<string, unknown> | undefined;
    expect(message).toBeDefined();
    expect(message!.body).toBe("BUTTON_CLICK");
    const extra = message!.extra as Record<string, unknown> | undefined;
    expect(extra).toBeDefined();
    expect(extra!.originalEvent).toBe("BUTTON_CLICK");
    expect(extra!.button_name).toBe("example_button");
  });
});
