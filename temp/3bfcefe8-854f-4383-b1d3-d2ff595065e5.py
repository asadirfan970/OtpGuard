import uiautomator2 as u2
import time
import os
import sys
import json

# Connect to the device
d = u2.connect()

# Helper to wait and log
def wait(msg, seconds=2):
    print(f"{msg} (waiting {seconds}s)")
    time.sleep(seconds)

def log_result(phone_number, status, message=""):
    """Log automation result for reporting back to backend"""
    result = {
        "phone_number": phone_number,
        "status": status,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "message": message
    }
    print(f"📊 Result: {json.dumps(result)}")
    
    # Write to results file for desktop app to read
    with open("automation_results.txt", "a", encoding="utf-8") as f:
        f.write(f"{json.dumps(result)}\n")

def main():
    print("🚀 Starting MICO automation script...")
    
    # Read configuration from desktop app
    config_file = "automation_config.json"
    if not os.path.exists(config_file):
        print(f"❌ Configuration file '{config_file}' not found!")
        print("This script should be run through the OtpGuard desktop application.")
        sys.exit(1)
    
    try:
        with open(config_file, "r", encoding="utf-8") as f:
            config = json.load(f)
        
        country_code = config.get("country_code")
        country_name = config.get("country_name")
        phone_numbers = config.get("phone_numbers", [])
        
        print(f"🌍 Country: {country_name} ({country_code})")
        print(f"📱 Phone numbers to process: {len(phone_numbers)}")
        
    except Exception as e:
        print(f"❌ Error reading configuration: {e}")
        sys.exit(1)
    
    if not phone_numbers:
        print("❌ No phone numbers found in configuration!")
        sys.exit(1)
    
    # Clear previous results
    if os.path.exists("automation_results.txt"):
        os.remove("automation_results.txt")
    
    try:
        # Launch the MICO app
        print("🚀 Launching MICO app...")
        d.app_start("com.mico")
        wait("App launched", 5)

        # Click on "Other Login Options"
        print("👉 Clicking on 'Other Login Options'...")
        if d(resourceId="com.mico:id/id_other_logins_tv").exists(timeout=10):
            d(resourceId="com.mico:id/id_other_logins_tv").click()
            wait("✅ Clicked on 'Other Login Options'", 3)
        else:
            log_result("", "error", "Could not find 'Other Login Options'")
            return

        # Click on Phone login option
        print("📱 Clicking on 'Phone Login' option...")
        login_buttons = d(resourceId="com.mico:id/id_login_type_iv")
        if login_buttons.exists(timeout=10):
            login_buttons[0].click()
            wait("✅ Clicked on 'Phone Login'", 2)
        else:
            log_result("", "error", "Could not find 'Phone Login' option")
            return

        # Click on phone number selector
        print("🌍 Clicking on phone number selector...")
        if d(resourceId="com.mico:id/id_phone_area_code_tv").exists(timeout=10):
            d(resourceId="com.mico:id/id_phone_area_code_tv").click()
            wait("✅ Clicked on phone selector", 2)
        else:
            log_result("", "error", "Could not find phone selector")
            return

        # Search for the specific country
        country_search_text = f"{country_name}  ({country_code})"
        print(f"📜 Searching for '{country_search_text}'...")
        
        found = False
        for i in range(30):  # Increased scroll attempts
            if d(text=country_search_text).exists:
                print(f"✅ Found '{country_search_text}'!")
                elem = d(text=country_search_text)
                bounds = elem.info.get('bounds')
                x = (bounds['left'] + bounds['right']) // 2
                y = (bounds['top'] + bounds['bottom']) // 2
                d.click(x, y)
                wait("✅ Selected country", 2)
                found = True
                break
            else:
                print(f"🔄 Not found, scrolling... ({i+1})")
                d(scrollable=True).scroll(steps=19)
                time.sleep(1)

        if not found:
            error_msg = f"Could not find country '{country_search_text}' in the list"
            print(f"❌ {error_msg}")
            log_result("", "error", error_msg)
            return

        print(f"📄 Processing {len(phone_numbers)} validated phone numbers...")

        # Process each number
        success_count = 0
        error_count = 0
        
        for idx, number in enumerate(phone_numbers, 1):
            print(f"\n📱 Processing number {idx}/{len(phone_numbers)}: {number}")

            try:
                # Click on number field
                if d(resourceId="com.mico:id/id_phone_phone_num_et").exists(timeout=10):
                    field = d(resourceId="com.mico:id/id_phone_phone_num_et")
                    field.click()
                    wait("🧹 Clearing old number...", 1)
                    field.clear_text()
                    wait("⌨️ Typing number...", 1)
                    d.send_keys(number)
                else:
                    log_result(number, "error", "Phone number field not found")
                    error_count += 1
                    continue

                # Click on Next button
                if d(resourceId="com.mico:id/id_next_step_msiv").exists(timeout=10):
                    d(resourceId="com.mico:id/id_next_step_msiv").click()
                    wait("✅ Clicked on Next", 5)
                else:
                    log_result(number, "error", "Next button not found")
                    error_count += 1
                    continue

                # Check for error messages or success
                if d(text="Invalid phone number").exists(timeout=3):
                    log_result(number, "invalid", "Invalid phone number format")
                    error_count += 1
                elif d(text="Receive by phone").exists(timeout=10):
                    # Success - SMS option is available
                    d(text="Receive by phone").click()
                    wait("📲 Chose 'Receive by phone'", 7)
                    log_result(number, "success", "SMS verification option available")
                    success_count += 1
                else:
                    log_result(number, "unknown", "Unexpected app state")
                    error_count += 1

                # Press back button to return to number input
                print("🔙 Pressing back button...")
                d.click(50, 140)  # Based on bounds: [0,80][112,192]
                wait("✅ Went back", 2)

                # Clear the number field again for next iteration
                if d(resourceId="com.mico:id/id_phone_phone_num_et").exists(timeout=10):
                    field = d(resourceId="com.mico:id/id_phone_phone_num_et")
                    field.click()
                    wait("🧹 Clearing for next number...", 1)
                    field.clear_text()
                    time.sleep(1)

            except Exception as e:
                log_result(number, "error", f"Exception during processing: {str(e)}")
                error_count += 1
                print(f"❌ Error processing {number}: {e}")

        print(f"\n✅ Automation completed!")
        print(f"📊 Summary: {success_count} successful, {error_count} errors")
        
        # Log final summary
        summary = {
            "type": "summary",
            "total_numbers": len(phone_numbers),
            "successful": success_count,
            "errors": error_count,
            "country": f"{country_name} ({country_code})",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        with open("automation_results.txt", "a", encoding="utf-8") as f:
            f.write(f"{json.dumps(summary)}\n")

    except Exception as e:
        print(f"❌ Critical error during automation: {e}")
        log_result("", "critical_error", str(e))

if __name__ == "__main__":
    main()
