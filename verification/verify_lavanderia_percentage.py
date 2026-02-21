from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8000/lavanderia.html")

    # Clear localStorage first
    page.evaluate("localStorage.clear()")
    page.reload()

    # Test Case 1: Decimal Percentage (14.5%)
    print("Testing 14.5% discount...")
    page.fill("#valorInput", "100")
    page.fill("#porcentagemInput", "14.5")
    page.click("#btnCalcular")

    # Verify table row
    # The table might take a moment to update? No, it's synchronous DOM update.
    # But wait, page.goto might need wait for load.

    row = page.locator("tbody#tabelaLog tr").first
    # inner_text returns "Time Orig % Final 11% Lucro Delete"
    # Actually it returns the text of all cells.

    # We should wait for the row to appear to be safe
    row.wait_for()

    row_text = row.inner_text().replace('\xa0', ' ')
    print(f"Row text: {row_text}")

    # Expected values:
    # Orig: 100
    # %: 14.5%
    # Final: 100 - 14.5 = 85.5 -> ceil -> 86
    # 11%: 100 - 11 = 89
    # Lucro: 89 - 86 = 3

    # Check currency formatting might add R$ and spaces
    # R$ 100,00 ...
    # But formatCurrency sets fraction digits to 0. So R$ 100.

    assert "R$ 100" in row_text
    assert "14.5%" in row_text
    assert "R$ 86" in row_text
    assert "R$ 89" in row_text
    assert "R$ 3" in row_text

    print("Test Case 1 Passed!")

    # Test Case 2: Integer Percentage (15%)
    print("Testing 15% discount...")
    page.fill("#valorInput", "100")
    page.fill("#porcentagemInput", "15")
    page.click("#btnCalcular")

    # Verify new row (topmost)
    row = page.locator("tbody#tabelaLog tr").first
    # Wait for the row to be the new one?
    # Since we add to top, the first row should change.
    # But we need to ensure the update happened.
    # We can check the text has "15%"

    # A small wait or check
    page.wait_for_function("document.querySelector('tbody#tabelaLog tr:first-child td:nth-child(3)').innerText.includes('15%')")

    row_text = row.inner_text().replace('\xa0', ' ')
    print(f"Row text: {row_text}")

    # Expected values:
    # Orig: 100
    # %: 15%
    # Final: 100 - 15 = 85
    # 11%: 89
    # Lucro: 89 - 85 = 4

    assert "R$ 100" in row_text
    assert "15%" in row_text
    assert "R$ 85" in row_text
    assert "R$ 89" in row_text
    assert "R$ 4" in row_text

    print("Test Case 2 Passed!")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
