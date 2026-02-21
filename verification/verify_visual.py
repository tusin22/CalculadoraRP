from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Verify Fazenda
    # Mock JSONBin
    page.route("https://api.jsonbin.io/v3/b/*/latest*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"record": []}'
    ))

    page.goto("http://localhost:8000/fazenda.html")

    # Wait for dynamic content
    page.wait_for_selector("#displayQueijoPronto")

    # Take screenshot of Fazenda
    page.screenshot(path="verification/fazenda_visual.png", full_page=True)
    print("Screenshot saved to verification/fazenda_visual.png")

    # 2. Verify Lavanderia
    page.goto("http://localhost:8000/lavanderia.html")

    # Add a dummy item to see the table populated
    page.fill("#valorInput", "50")
    page.click("#btnCalcular")

    # Take screenshot of Lavanderia
    page.screenshot(path="verification/lavanderia_visual.png", full_page=True)
    print("Screenshot saved to verification/lavanderia_visual.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
