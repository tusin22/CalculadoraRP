from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8000/lavanderia.html")

    # Clear localStorage first
    page.evaluate("localStorage.clear()")
    page.reload()

    # Fill inputs
    page.fill("#valorInput", "200")
    page.fill("#porcentagemInput", "12.5")

    # Take screenshot of inputs before calculation
    # We can focus on the container to see inputs clearly
    element = page.locator(".container")
    element.screenshot(path="verification/lavanderia_inputs.png")

    page.click("#btnCalcular")

    # Take screenshot of full app to see table
    page.screenshot(path="verification/lavanderia_result.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
