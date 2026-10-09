import pytest
from playwright.sync_api import sync_playwright

def test_full_browser_prediction_and_scenarios():
    """E2E Playwright test verifying the complete user workflow in real browser."""
    console_errors = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Listen for console errors
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        
        # 1. Navigate to /predict
        page.goto("http://localhost:3000/predict", timeout=30000)
        assert "HOUSEPRICE AI" in page.title()
        
        # 2. Wait for form to load
        page.wait_for_selector("form", timeout=15000)
        
        # 3. Submit estimate by clicking the estimate button
        submit_btn = page.locator("button:has-text('Estimate Property Value')")
        submit_btn.scroll_into_view_if_needed()
        submit_btn.click()
        
        # 4. Wait for prediction display
        page.wait_for_selector("text=MODEL ESTIMATE (POINT PREDICTION)", timeout=25000)
        
        # 5. Check Conformal Interval
        assert page.locator("text=MODEL PREDICTION INTERVAL").is_visible()
        
        # 6. Check Historical Comparables Section
        assert page.locator("text=HISTORICAL DATASET COMPARABLES").is_visible()
        
        # 7. Check Scenario Workspace
        page.locator("text=SCENARIO WORKSPACE & COMPARISON").scroll_into_view_if_needed()
        assert page.locator("text=SCENARIO WORKSPACE & COMPARISON").is_visible()
        assert page.locator("text=Current Property").first.is_visible()
        assert page.locator("text=Improved Property").first.is_visible()
        assert page.locator("text=Alternative Property").first.is_visible()
        
        # 8. Check Affordability Planner
        page.locator("text=Affordability Planner").first.scroll_into_view_if_needed()
        assert page.locator("text=Affordability Planner").first.is_visible()
        assert page.locator("text=Illustrative payment calculation").first.is_visible()
        
        # 9. Navigate to /what-if
        page.goto("http://localhost:3000/what-if", timeout=20000)
        page.wait_for_selector("text=What-If", timeout=15000)
        
        # 10. Navigate to /model-lab
        page.goto("http://localhost:3000/model-lab", timeout=20000)
        page.wait_for_selector("text=Model Lab", timeout=15000)
        
        # 11. Navigate to /history
        page.goto("http://localhost:3000/history", timeout=20000)
        page.wait_for_selector("text=Prediction History", timeout=15000)
        
        browser.close()
        
    # Check for unhandled fatal React/JS errors
    fatal_errors = [e for e in console_errors if "Uncaught" in e or "TypeError" in e]
    assert len(fatal_errors) == 0, f"Fatal console errors detected: {fatal_errors}"

if __name__ == "__main__":
    test_full_browser_prediction_and_scenarios()
    print("Browser E2E test passed flawlessly!")
