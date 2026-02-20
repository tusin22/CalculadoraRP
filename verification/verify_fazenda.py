from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8000/fazenda.html")

    # Wait for the main content to load
    page.wait_for_selector(".container")

    # Check if the chart canvas exists (it should NOT)
    chart_present = page.locator("#graficoColeta").count() > 0
    print(f"Chart present: {chart_present}")

    # Check if the table is present (it SHOULD)
    table_present = page.locator("#tabelaLog").count() > 0
    print(f"Table present: {table_present}")

    # Screenshot the whole page
    page.screenshot(path="verification/fazenda_screenshot.png", full_page=True)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
