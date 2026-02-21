from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8000/lavanderia.html")

    # Clear localStorage first
    page.evaluate("localStorage.clear()")
    page.reload()

    # Add an item
    page.fill("#valorInput", "100")
    page.click("#btnCalcular")

    # Check if item exists in table
    rows = page.locator("#tabelaLog tr")
    print(f"Rows after add: {rows.count()}")
    # Header + 1 row = 2 rows in table?
    # Current implementation: fragment appends rows. The table has `thead` and `tbody`.
    # `rows` selector matches tr inside table. Header is in `thead`, items in `tbody`.
    # locator("tbody#tabelaLog tr")
    item_rows = page.locator("tbody#tabelaLog tr")
    assert item_rows.count() == 1

    # Get data from localStorage
    data = page.evaluate("localStorage.getItem('lavanderia_historico')")
    print(f"LocalStorage data: {data}")
    assert data is not None and "100" in data

    # Reload page
    page.reload()

    # Check if item still exists
    item_rows_after_reload = page.locator("tbody#tabelaLog tr")
    print(f"Rows after reload: {item_rows_after_reload.count()}")
    assert item_rows_after_reload.count() == 1

    # Check "Totais"
    total_orig = page.locator("#totOriginal").inner_text()
    print(f"Total Original: {total_orig}")
    assert "100" in total_orig

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
