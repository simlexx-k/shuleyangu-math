from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Go to Science Dashboard
    print("Navigating to Science Dashboard...")
    page.goto("http://localhost:5173/science")
    page.wait_for_selector(".dashboard")
    page.screenshot(path="verification/science_dashboard.png")
    print("Dashboard screenshot taken.")

    # Click on Pendulum Lab
    print("Navigating to Pendulum Lab...")
    page.click("text=Open Pendulum Lab")

    # Wait for lab to load
    page.wait_for_selector("canvas")
    # Wait a bit for animation to start drawing
    page.wait_for_timeout(1000)

    page.screenshot(path="verification/pendulum_lab.png")
    print("Pendulum Lab screenshot taken.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
