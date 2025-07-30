import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import subprocess
import sqlite3
import threading
import time
import os
import uiautomator2 as u2

# Database setup

stop_flag = threading.Event()
automation_thread = None
DB_FILE = "automation.db"

# Check and initialize database if not found
if not os.path.exists(DB_FILE):
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS countries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            code TEXT,
            number_length INTEGER
        )''')
        c.execute('''CREATE TABLE IF NOT EXISTS numbers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id INTEGER,
            full_number TEXT UNIQUE
        )''')
        conn.commit()
        print("📦 Created new database 'automation.db'")
        
# Now open connection for app use
conn = sqlite3.connect(DB_FILE)
c = conn.cursor()

c.execute('''CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    code TEXT,
    number_length INTEGER
)''')
c.execute('''CREATE TABLE IF NOT EXISTS numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_id INTEGER,
    full_number TEXT UNIQUE
)''')
conn.commit()

# Globals
countries = []
adb_connected_devices = set()

# Helper functions
def log(msg):
    log_text.configure(state='normal')
    log_text.insert(tk.END, msg + "\n")
    log_text.configure(state='disabled')
    log_text.see(tk.END)

def adb_monitor():
    global adb_connected_devices
    while True:
        result = subprocess.getoutput("adb devices")
        lines = result.strip().splitlines()[1:]
        devices = {line.split()[0] for line in lines if 'device' in line}
        if devices != adb_connected_devices:
            adb_connected_devices = devices
            status = f"Connected ADB Devices: {', '.join(devices) if devices else 'None'}"
            device_label.config(text=status)
        time.sleep(5)

def add_country():
    name = entry_country_name.get()
    code = entry_country_code.get()
    length = entry_number_length.get()
    if not (name and code and length):
        messagebox.showerror("Error", "Fill all fields")
        return
    try:
        c.execute("INSERT INTO countries (name, code, number_length) VALUES (?, ?, ?)",
                  (name, code, int(length)))
        conn.commit()
        log(f"Added country: {name} (+{code})")
        refresh_countries()
    except Exception as e:
        messagebox.showerror("DB Error", str(e))

def refresh_countries():
    countries.clear()
    for row in c.execute("SELECT * FROM countries"):
        countries.append(row)
    update_country_table()
    update_country_dropdown()

def update_country_dropdown():
    country_dropdown['menu'].delete(0, 'end')
    for row in countries:
        country_dropdown['menu'].add_command(label=row[1], command=tk._setit(country_var, row[1]))
    if countries:
        country_var.set(countries[0][1])

def update_country_table():
    for row in country_tree.get_children():
        country_tree.delete(row)
    for country in countries:
        country_tree.insert('', 'end', values=(country[1], f"+{country[2]}", country[3]))

def update_number_table():
    for row in number_tree.get_children():
        number_tree.delete(row)

    selected = country_var.get()
    total = 0
    country_id = None

    for country in countries:
        if country[1] == selected:
            country_id = country[0]
            break

    if country_id is None:
        label_total_numbers.config(text="Total Numbers: 0")
        return  # no valid country selected yet

    rows = c.execute("SELECT full_number FROM numbers WHERE country_id=?", (country_id,)).fetchall()
    for row in rows:
        number_tree.insert('', 'end', values=(row[0],))
    total = len(rows)
    label_total_numbers.config(text=f"Total Numbers: {total}")



def upload_numbers():
    path = filedialog.askopenfilename(filetypes=[("Text Files", "*.txt")])
    if not path:
        return
    selected = country_var.get()
    for country in countries:
        if country[1] == selected:
            country_id, name, code, length = country
            break
    valid = []
    with open(path, "r") as f:
        for line in f:
            num = line.strip()
            if num.startswith("+" + code) and len(num[len(code)+1:]) == length:
                valid.append((country_id, num))
    count = 0
    for cid, num in valid:
        try:
            c.execute("INSERT INTO numbers (country_id, full_number) VALUES (?, ?)", (cid, num))
            count += 1
        except:
            continue
    conn.commit()
    log(f"Uploaded {len(valid)} valid numbers. {count} new entries saved.")
    update_number_table()

def start_automation():
    global automation_thread
    stop_flag.clear()
    automation_thread = threading.Thread(target=run_script)
    automation_thread.start()


def run_script():
    global stop_flag
    stop_flag.clear()
    selected_country = country_var.get()
    if not selected_country:
        log("❗ Please select a country.")
        return

    try:
        devices = subprocess.check_output(["adb", "devices"]).decode().strip().splitlines()[1:]
        devices = [line.split()[0] for line in devices if "device" in line]
    except Exception as e:
        log(f"❌ Failed to get ADB devices: {e}")
        return

    if not devices:
        log("❗ No ADB device connected.")
        return

    device_id = devices[0]
    d = u2.connect(device_id)
    log(f"📱 Connected to device {device_id}")

    thread_conn = sqlite3.connect(DB_FILE)
    thread_c = thread_conn.cursor()

    thread_c.execute("SELECT id, code FROM countries WHERE name=?", (selected_country,))
    row = thread_c.fetchone()

    if not row:
        log("❗ Selected country not found in database.")
        thread_conn.close()
        return

    country_id, code = row


    
    numbers = thread_c.execute("SELECT full_number FROM numbers WHERE country_id=?", (country_id,)).fetchall()
    thread_conn.close()

    if not numbers:
        log("⚠️ No numbers found for selected country.")
        return

    log(f"📄 Loaded {len(numbers)} numbers for {selected_country}.")

    def wait(msg, seconds=2):
        log(f"{msg} (waiting {seconds}s)")
        time.sleep(seconds)

    try:
        log("🚀 Launching MICO app...")
        d.app_start("com.mico")
        wait("App launched", 5)

        if d(resourceId="com.mico:id/id_other_logins_tv").exists(timeout=10):
            d(resourceId="com.mico:id/id_other_logins_tv").click()
            wait("✅ Clicked on 'Other Login Options'", 3)

                # Ensure correct button is clicked based on 'Sign in with Phone'
        if d(resourceId="com.mico:id/id_login_btn_tv", text="Sign in with Phone").exists(timeout=10):
            elem = d(resourceId="com.mico:id/id_login_btn_tv", text="Sign in with Phone")
            bounds = elem.info.get('bounds')
            x = (bounds['left'] + bounds['right']) // 2
            y = (bounds['top'] + bounds['bottom']) // 2
            d.click(x, y)
            wait("✅ Clicked on 'Sign in with Phone'", 2)
        else:
            log("❌ 'Sign in with Phone' button not found!")
            return

        if d(resourceId="com.mico:id/id_phone_area_code_tv").exists(timeout=10):
            d(resourceId="com.mico:id/id_phone_area_code_tv").click()
            wait("✅ Clicked on phone selector", 2)

        log(f"📜 Scrolling to find '{selected_country}  ({code})'...")
        full_country_text = f"{selected_country}  ({code})"
        found = False
        elem = None  # predefine for later access

        for i in range(20):
            potential = d(text=full_country_text)
            if potential.exists:
                bounds = potential.info.get('bounds')
                x = (bounds['left'] + bounds['right']) // 2
                y = (bounds['top'] + bounds['bottom']) // 2
                d.click(x, y)
                wait(f"✅ Clicked on {full_country_text}, waiting for phone input screen...", 2)

                # Wait for phone input to appear after selection
                for _ in range(5):
                    if d(resourceId="com.mico:id/id_phone_phone_num_et").exists:
                        log(f"✅ Country '{full_country_text}' selected, moved to phone input screen.")
                        found = True
                        break
                    time.sleep(1)

                if found:
                    break
                else:
                    log(f"⚠️ UI didn't transition after clicking '{full_country_text}', retrying scroll.")


            else:
                log(f"🔄 Not found, scrolling... ({i+1})")
                d(scrollable=True).scroll(steps=40)
                time.sleep(1)

        if not found:
            log(f"❌ Could not select or confirm '{full_country_text}', exiting.")
            return
        

        for idx, (number,) in enumerate(numbers, 1):
            if stop_flag.is_set():
                log("🛑 Automation was cancelled by user")
                break

            try:
                log(f"\n📱 Processing number {idx}: {number}")

                if d(resourceId="com.mico:id/id_phone_phone_num_et").exists(timeout=10):
                    field = d(resourceId="com.mico:id/id_phone_phone_num_et")
                    field.click()
                    wait("🧹 Clearing old number...", 1)
                    field.clear_text()
                    wait("⌨️ Typing number...", 1)
                    local_number = number.replace(f"+{code}", "", 1).strip()
                    d.send_keys(local_number)

                else:
                    log("❌ Phone number field not found!")
                    continue

                if d(resourceId="com.mico:id/id_next_step_msiv").exists(timeout=10):
                    d(resourceId="com.mico:id/id_next_step_msiv").click()
                    wait("✅ Clicked on Next", 5)
                else:
                    log("❌ Next button not found!")
                    continue

                if d(text="Receive by phone").exists(timeout=10):
                    d(text="Receive by phone").click()
                    wait("📲 Chose 'Receive by phone'", 7)
                else:
                    log("❌ 'Receive by phone' not found!")
                    continue

                log("🔙 Pressing back button...")
                d.click(50, 140)
                wait("✅ Went back", 2)

                if d(resourceId="com.mico:id/id_phone_phone_num_et").exists(timeout=10):
                    field = d(resourceId="com.mico:id/id_phone_phone_num_et")
                    field.click()
                    wait("🧹 Clearing for next number...", 1)
                    field.clear_text()
                    time.sleep(1)
                else:
                    log("⚠️ Could not clear field after back. Continuing...")

            except Exception as e:
                log(f"⚠️ Error while processing {number}: {e}")


        

    except Exception as e:
        log(f"❌ Automation error: {e}")


# GUI Setup
root = tk.Tk()
root.title("Professional MICO Automation Panel")
root.geometry("1100x700")
root.state('zoomed')


# Country Frame
frame_country = ttk.LabelFrame(root, text="Manage Countries")
frame_country.pack(fill='x', padx=10, pady=5)

entry_country_name = ttk.Entry(frame_country, width=20)
entry_country_name.insert(0, "Mali")
entry_country_name.pack(side='left', padx=5)
entry_country_code = ttk.Entry(frame_country, width=15)
entry_country_code.insert(0, "223")
entry_country_code.pack(side='left', padx=5)
entry_number_length = ttk.Entry(frame_country, width=15)
entry_number_length.insert(0, "8")
entry_number_length.pack(side='left', padx=5)

btn_add_country = ttk.Button(frame_country, text="Add Country", command=add_country)
btn_add_country.pack(side='left', padx=5)

# Country Dropdown + Buttons
frame_ops = ttk.LabelFrame(root, text="Operations")
frame_ops.pack(fill='x', padx=10, pady=5)

country_var = tk.StringVar()
def on_country_selected(*args):
    update_number_table()

country_var.trace_add('write', on_country_selected)

country_dropdown = ttk.OptionMenu(frame_ops, country_var, "")
country_dropdown.pack(side='left', padx=5)

btn_upload = ttk.Button(frame_ops, text="Upload Numbers", command=upload_numbers)
btn_upload.pack(side='left', padx=5)

btn_run = ttk.Button(frame_ops, text="Run Automation", command=lambda: start_automation())
btn_run.pack(side='left', padx=5)

btn_stop = ttk.Button(frame_ops, text="Stop Automation", command=lambda: stop_flag.set())
btn_stop.pack(side='left', padx=5)


# ADB Device Label
device_label = ttk.Label(root, text="Connected ADB Devices: None")
device_label.pack(pady=5)

# Split View for Tables
frame_tables = ttk.Frame(root)
frame_tables.pack(fill='both', expand=True, padx=10, pady=5)

# Countries Table
frame_left = ttk.Frame(frame_tables)
frame_left.pack(side='left', fill='both', expand=True, padx=5)

label_countries = ttk.Label(frame_left, text="Available Countries")
label_countries.pack()

country_tree = ttk.Treeview(frame_left, columns=("Name", "Code", "Length"), show='headings')
for col in ("Name", "Code", "Length"):
    country_tree.heading(col, text=col)
    country_tree.column(col, width=100)
country_tree.pack(fill='both', expand=True)

# Numbers Table
frame_right = ttk.Frame(frame_tables)
frame_right.pack(side='left', fill='both', expand=True, padx=5)

label_numbers = ttk.Label(frame_right, text="Numbers for Selected Country")
label_numbers.pack()

label_total_numbers = ttk.Label(frame_right, text="Total Numbers: 0")
label_total_numbers.pack()

number_tree = ttk.Treeview(frame_right, columns=("Number",), show='headings')
number_tree.heading("Number", text="Number")
number_tree.column("Number", width=150)
number_tree.pack(fill='both', expand=True)

# Log Area
frame_log = ttk.LabelFrame(root, text="Logs")
frame_log.pack(fill='both', expand=True, padx=10, pady=5)

log_text = tk.Text(frame_log, wrap='word', height=10, state='disabled')
log_text.pack(fill='both', expand=True)

# Start App
threading.Thread(target=adb_monitor, daemon=True).start()
refresh_countries()
update_number_table()
root.mainloop()