from playwright.sync_api import sync_playwright
import datetime
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock JSONBin to avoid polluting real data and ensure clean state
    # GET returns empty list
    page.route("https://api.jsonbin.io/v3/b/*/latest*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"record": []})
    ))
    # PUT returns success
    page.route("https://api.jsonbin.io/v3/b/*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"success": True})
    ))

    page.goto("http://localhost:8000/fazenda.html")

    # 1. Verify Select Options match CONFIG.jogadores
    options = page.locator("#nomeInput option").all_inner_texts()
    print(f"Select Options: {options}")
    expected_players = ["Tusin", "Gabo", "RZ", "Dessim"]
    for player in expected_players:
        assert player in options, f"{player} not found in options"

    # 2. Verify Summary Headers match CONFIG.jogadores
    # We look for the names in the summary section
    summary_text = page.locator("#resumoDiaContainer").inner_text()
    print(f"Summary Text:\n{summary_text}")
    for player in expected_players:
        assert player in summary_text, f"{player} not found in summary"

    # 3. Verify Calculation Logic
    # Add 37 milk for Tusin.
    # CONFIG.leitePorPrateleira = 36. So 37/36 = 1.02 -> 2 shelves.

    page.select_option("#nomeInput", "Tusin")
    page.fill("#leiteInput", "37")
    page.click("#btnRegistrar")

    # Wait for DOM update
    page.wait_for_timeout(500)

    # Check shelves
    shelves_text = page.locator("#displayPrateleiras").inner_text()
    print(f"Shelves Text: {shelves_text}")
    # Look for "2"
    assert "2" in shelves_text, "Shelves calculation incorrect, expected 2"

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
