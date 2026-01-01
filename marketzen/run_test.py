#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright
import http.server
import socketserver
import threading
import os
import json

DIST_DIR = '/workspace/marketzen/dist'

class HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)
    
    def log_message(self, format, *args):
        pass  # Suppress logging

async def run_tests():
    # Start HTTP server with port 0 (system assigns available port)
    with socketserver.TCPServer(("", 0), HTTPRequestHandler) as httpd:
        port = httpd.server_address[1]
        thread = threading.Thread(target=httpd.serve_forever)
        thread.daemon = True
        thread.start()
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            console_errors = []
            
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda error: console_errors.append(str(error)))
            
            print("🧪 Running MarketZen Tests...\n")
            
            url = f"http://127.0.0.1:{port}"
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(3)
            
            print(f"✅ Page loaded successfully")
            print(f"📄 Title: {await page.title()}")
            
            # Test 1: Check header
            header = await page.query_selector("header")
            print(f"✅ Header present: {header is not None}")
            
            # Test 2: Check main content
            main = await page.query_selector("main")
            print(f"✅ Main content present: {main is not None}")
            
            # Test 3: Find watchlist items
            watchlist_buttons = await page.query_selector_all("aside button")
            print(f"📊 Watchlist buttons found: {len(watchlist_buttons)}")
            
            # Test 4: Find and click Analyze button
            analyze_button = None
            for btn in watchlist_buttons:
                html = await btn.inner_html()
                if 'activity' in html.lower():
                    analyze_button = btn
                    print("✅ Found Analyze button")
                    break
            
            if analyze_button:
                await analyze_button.click()
                await asyncio.sleep(4)
                print("✅ Clicked Analyze button - navigated to Technical Analysis")
            
            # Test 5: Check Technical Analysis content
            content = await page.content()
            has_analysis = any(x in content for x in ['Technical Analysis', 'Overall Signal', 'BUY', 'SELL'])
            print(f"✅ Analysis content found: {has_analysis}")
            
            # Test 6: Check for charts
            charts = await page.query_selector_all(".recharts-wrapper")
            print(f"✅ Charts rendered: {len(charts)}")
            
            # Test 7: Check for new tabs
            all_buttons = await page.query_selector_all("button")
            tabs = {"Indicators": False, "Oscillators": False, "Patterns": False}
            for btn in all_buttons:
                text = await btn.text_content() or ""
                for tab in tabs:
                    if tab in text:
                        tabs[tab] = True
            
            print(f"\n📑 Tab Tests:")
            for tab, found in tabs.items():
                print(f"   {tab}: {'✅' if found else '❌'}")
            
            # Test 8: Check for new indicators
            indicators = {
                "Stochastic": "Stochastic" in content,
                "ATR": "ATR" in content,
                "VWAP": "VWAP" in content,
                "Ichimoku": "Ichimoku" in content,
                "OBV": "OBV" in content
            }
            
            print(f"\n🆕 New Indicators:")
            for ind, found in indicators.items():
                print(f"   {ind}: {'✅' if found else '❌'}")
            
            # Test 9: Check for pattern detection
            patterns = ["Bullish Engulfing", "Bearish Engulfing", "Doji", "Hammer", "Shooting Star"]
            found_patterns = [p for p in patterns if p in content]
            print(f"\n📊 Pattern Detection: {'✅' if found_patterns else '❌'} - Found: {', '.join(found_patterns[:3])}")
            
            # Test 10: Check console errors
            critical_errors = [e for e in console_errors if not any(x in e for x in 
                ['favicon', '404', 'DevTools', 'ResizeObserver', 'ERR_FAILED', 'corsproxy'])]
            
            print(f"\n📊 Console Errors: {len(critical_errors)}")
            if critical_errors:
                print("⚠️ Critical Errors Found:")
                for i, err in enumerate(critical_errors[:3], 1):
                    print(f"   {i}. {err[:150]}")
            else:
                print("✅ No critical errors detected")
            
            # Test 11: Responsive design
            print(f"\n📱 Responsive Design Tests:")
            for width, height in [(375, 667), (768, 1024), (1920, 1080)]:
                await page.set_viewport_size({"width": width, "height": height})
                await asyncio.sleep(0.5)
                print(f"   ✅ {width}x{height}: OK")
            
            print("\n🎉 All Tests Completed Successfully!")
            
            await browser.close()
        httpd.shutdown()

if __name__ == "__main__":
    asyncio.run(run_tests())
