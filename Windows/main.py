import os
import sys
import json
import logging
import subprocess
import tempfile
import threading
import time
import shutil
import re
from pathlib import Path
from getmac import get_mac_address
import requests
from tkinter import *
from tkinter import ttk, messagebox, filedialog
from datetime import datetime

# Configure logging with proper encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('otp_automation.log', encoding='utf-8')
    ]
)

class OTPAutomationApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Secure OTP Automation Platform")
        self.root.geometry("900x700")
        self.root.resizable(True, True)
        
        # API Configuration
        self.base_url = "http://localhost:5000"  # Updated to match server port
        self.session = requests.Session()  # Use session for cookie handling
        self.mac_address = get_mac_address()
        
        # Data storage
        self.scripts_data = []
        self.countries_data = []
        self.current_task_id = None
        self.automation_process = None
        self.temp_dir = None
        self.validated_numbers = []
        self.connected_device = None
        self.downloaded_script_path = None
        
        # UI Elements
        self.setup_ui()
        
        # Setup cleanup on close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Check if already logged in
        self.check_credentials()
    
    def setup_ui(self):
        # Main container
        self.main_frame = ttk.Frame(self.root, padding="10")
        self.main_frame.pack(fill=BOTH, expand=True)
        
        # Login Frame - Centered design
        self.login_container = ttk.Frame(self.main_frame)
        self.login_container.pack(expand=True, fill=BOTH)
        
        self.login_frame = ttk.LabelFrame(self.login_container, text="🔐 Secure OTP Automation - Login", padding="30")
        self.login_frame.place(relx=0.5, rely=0.5, anchor=CENTER)
        
        # Configure grid weights for centering
        self.login_frame.grid_columnconfigure(0, weight=1)
        self.login_frame.grid_columnconfigure(1, weight=2)
        
        # Title
        title_label = ttk.Label(self.login_frame, text="Welcome to OTP Guard", font=('Arial', 16, 'bold'))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # Email field
        ttk.Label(self.login_frame, text="Email:", font=('Arial', 10)).grid(row=1, column=0, padx=(0, 10), pady=10, sticky=E)
        self.email_var = StringVar()
        self.email_entry = ttk.Entry(self.login_frame, textvariable=self.email_var, width=30, font=('Arial', 10))
        self.email_entry.grid(row=1, column=1, padx=(0, 10), pady=10, sticky=W)
        
        # Password field
        ttk.Label(self.login_frame, text="Password:", font=('Arial', 10)).grid(row=2, column=0, padx=(0, 10), pady=10, sticky=E)
        self.password_var = StringVar()
        self.password_entry = ttk.Entry(self.login_frame, textvariable=self.password_var, show="*", width=30, font=('Arial', 10))
        self.password_entry.grid(row=2, column=1, padx=(0, 10), pady=10, sticky=W)
        
        # Login button
        self.login_btn = ttk.Button(self.login_frame, text="🚀 Login", command=self.login)
        self.login_btn.grid(row=3, column=0, columnspan=2, pady=20)
        
        # MAC Address info
        mac_info = ttk.Label(self.login_frame, text=f"Device MAC: {self.mac_address[:17]}...", font=('Arial', 8), foreground='gray')
        mac_info.grid(row=4, column=0, columnspan=2, pady=(10, 0))
        
        # Main Content Frame (initially hidden)
        self.content_frame = ttk.Frame(self.main_frame)
        
        # Header with logout button
        header_frame = ttk.Frame(self.content_frame)
        header_frame.pack(fill=X, pady=(0, 10))
        
        welcome_label = ttk.Label(header_frame, text="🎯 OTP Automation Dashboard", font=('Arial', 14, 'bold'))
        welcome_label.pack(side=LEFT)
        
        self.logout_btn = ttk.Button(header_frame, text="🚪 Logout", command=self.logout)
        self.logout_btn.pack(side=RIGHT)
        
        # Configuration Frame
        config_frame = ttk.LabelFrame(self.content_frame, text="⚙️ Configuration", padding="15")
        config_frame.pack(fill=X, pady=(0, 10))
        
        # Script Selection
        ttk.Label(config_frame, text="Select Script:", font=('Arial', 10, 'bold')).pack(anchor=W, pady=(5, 0))
        self.script_var = StringVar()
        self.script_dropdown = ttk.Combobox(config_frame, textvariable=self.script_var, state="readonly", font=('Arial', 10))
        self.script_dropdown.pack(fill=X, pady=(5, 10))
        
        # Country Selection
        ttk.Label(config_frame, text="Select Country:", font=('Arial', 10, 'bold')).pack(anchor=W, pady=(5, 0))
        self.country_var = StringVar()
        self.country_dropdown = ttk.Combobox(config_frame, textvariable=self.country_var, state="readonly", font=('Arial', 10))
        self.country_dropdown.pack(fill=X, pady=(5, 10))
        
        # Numbers File Selection
        self.numbers_file = StringVar()
        file_frame = ttk.Frame(config_frame)
        file_frame.pack(fill=X, pady=(5, 0))
        
        ttk.Label(file_frame, text="Numbers File:", font=('Arial', 10, 'bold')).pack(anchor=W)
        ttk.Button(
            file_frame, 
            text="📁 Upload numbers.txt", 
            command=self.select_numbers_file
        ).pack(pady=(5, 0))
        
        # Log Area
        self.log_frame = ttk.LabelFrame(self.content_frame, text="Execution Logs", padding="5")
        self.log_frame.pack(fill=BOTH, expand=True, pady=10)
        
        self.log_text = Text(self.log_frame, wrap=WORD, height=15)
        self.log_text.pack(fill=BOTH, expand=True, padx=5, pady=5)
        
        scrollbar = ttk.Scrollbar(self.log_frame, orient=VERTICAL, command=self.log_text.yview)
        scrollbar.pack(side=RIGHT, fill=Y)
        self.log_text.config(yscrollcommand=scrollbar.set)
        
        # Start Button
        self.start_btn = ttk.Button(
            self.content_frame, 
            text="Start Automation", 
            command=self.start_automation,
            state=DISABLED
        )
        self.start_btn.pack(pady=10)
        
        # Status Bar
        self.status_var = StringVar()
        self.status_bar = ttk.Label(self.root, textvariable=self.status_var, relief=SUNKEN, anchor=W)
        self.status_bar.pack(side=BOTTOM, fill=X)
        self.update_status("Ready")
    
    def log(self, message, level="info"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        self.log_text.insert(END, log_message + "\n")
        self.log_text.see(END)
        
        if level == "error":
            logging.error(message)
        elif level == "warning":
            logging.warning(message)
        else:
            logging.info(message)
    
    def update_status(self, message):
        self.status_var.set(message)
        self.root.update_idletasks()
    
    def check_credentials(self):
        # Check for saved credentials
        if os.path.exists("config.json"):
            try:
                with open("config.json", "r") as f:
                    config = json.load(f)
                    if "email" in config:
                        self.email_var.set(config["email"])
                        # Try to validate session by making a test API call
                        self.validate_session()
            except Exception as e:
                self.log(f"Error loading config: {str(e)}", "error")
    
    def validate_session(self):
        """Validate if the current session is still active"""
        try:
            response = self.session.get(f"{self.base_url}/api/countries")
            if response.status_code == 200:
                self.after_login()
        except:
            pass  # Session not valid, user will need to login again
    
    def login(self):
        email = self.email_var.get().strip()
        password = self.password_var.get()
        
        if not email or not password:
            messagebox.showerror("Error", "Please enter both email and password")
            return
        
        try:
            # Debug: Log the data being sent
            login_data = {
                "email": email,
                "password": password,
                "macAddress": self.mac_address
            }
            self.log(f"Debug: Sending login request with MAC: {self.mac_address}", "info")
            
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=login_data
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Save credentials (just email for session persistence)
                with open("config.json", "w") as f:
                    json.dump({"email": email}, f)
                
                self.after_login()
                self.log("Login successful")
            else:
                error_msg = "Invalid credentials"
                try:
                    error_msg = response.json().get("message", error_msg)
                except:
                    pass
                messagebox.showerror("Login Failed", error_msg)
                
        except requests.exceptions.RequestException as e:
            messagebox.showerror("Connection Error", f"Could not connect to server: {str(e)}")
    
    def logout(self):
        """Logout user and return to login screen"""
        try:
            # Clear session cookies
            self.session.cookies.clear()
            
            # Remove saved credentials
            if os.path.exists("config.json"):
                os.remove("config.json")
            
            # Clear form data
            self.email_var.set("")
            self.password_var.set("")
            self.script_var.set("")
            self.country_var.set("")
            self.numbers_file.set("")
            
            # Clear data
            self.scripts_data = []
            self.countries_data = []
            self.script_dropdown['values'] = []
            self.country_dropdown['values'] = []
            
            # Clear logs
            self.log_text.delete(1.0, END)
            
            # Show login screen
            self.content_frame.pack_forget()
            self.login_container.pack(expand=True, fill=BOTH)
            
            self.update_status("Logged out successfully")
            self.log("Logged out successfully")
            
        except Exception as e:
            self.log(f"Error during logout: {str(e)}", "error")
    
    def after_login(self):
        self.login_container.pack_forget()
        self.content_frame.pack(fill=BOTH, expand=True)
        self.fetch_scripts()
        self.fetch_countries()
    
    def fetch_scripts(self):
        try:
            response = self.session.get(f"{self.base_url}/api/scripts")
            
            if response.status_code == 200:
                scripts = response.json()
                self.scripts_data = scripts
                script_names = [s['appName'] for s in scripts]
                self.script_dropdown['values'] = script_names
                if script_names:
                    self.script_var.set(script_names[0])
                self.log(f"Loaded {len(scripts)} scripts")
            else:
                self.log(f"Failed to fetch scripts: {response.text}", "error")
                
        except Exception as e:
            self.log(f"Error fetching scripts: {str(e)}", "error")
    
    def fetch_countries(self):
        try:
            response = self.session.get(f"{self.base_url}/api/countries")
            
            if response.status_code == 200:
                countries = response.json()
                self.countries_data = countries
                country_names = [f"{c['name']} (+{c['code']})" for c in countries]
                self.country_dropdown['values'] = country_names
                if country_names:
                    self.country_var.set(country_names[0])
                self.log(f"Loaded {len(countries)} countries")
            else:
                self.log(f"Failed to fetch countries: {response.text}", "error")
                
        except Exception as e:
            self.log(f"Error fetching countries: {str(e)}", "error")
    
    def validate_phone_numbers(self, numbers, country_data):
        """Validate phone numbers according to country rules"""
        valid_numbers = []
        invalid_numbers = []
        
        country_code = country_data['code']
        expected_length = country_data['numberLength']
        
        for number in numbers:
            number = number.strip()
            if not number:
                continue
                
            # Remove country code if present
            if number.startswith(country_code):
                number_without_code = number[len(country_code):]
            elif number.startswith('+' + country_code[1:]):
                number_without_code = number[len(country_code):]
            else:
                number_without_code = number
            
            # Remove any non-digit characters
            clean_number = re.sub(r'\D', '', number_without_code)
            
            # Check if length matches expected
            if len(clean_number) == expected_length:
                valid_numbers.append(clean_number)
            else:
                invalid_numbers.append(number)
        
        return valid_numbers, invalid_numbers
    
    def select_numbers_file(self):
        file_path = filedialog.askopenfilename(
            title="Select numbers.txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                # Read numbers from file
                with open(file_path, 'r', encoding='utf-8') as f:
                    numbers = f.readlines()
                
                # Get selected country data
                selected_country = self.country_var.get()
                if not selected_country:
                    messagebox.showerror("Error", "Please select a country first")
                    return
                
                # Find country data
                country_data = None
                for country in self.countries_data:
                    if f"{country['name']} (+{country['code']})" == selected_country:
                        country_data = country
                        break
                
                if not country_data:
                    messagebox.showerror("Error", "Invalid country selection")
                    return
                
                # Validate numbers
                valid_numbers, invalid_numbers = self.validate_phone_numbers(numbers, country_data)
                
                if valid_numbers:
                    self.validated_numbers = valid_numbers
                    self.numbers_file.set(file_path)
                    self.start_btn.config(state=NORMAL)
                    
                    # Show validation results
                    message = f"✅ Numbers validation completed!\n\n"
                    message += f"Valid numbers: {len(valid_numbers)}\n"
                    if invalid_numbers:
                        message += f"Invalid numbers: {len(invalid_numbers)}\n\n"
                        message += "Invalid numbers will be skipped."
                    
                    messagebox.showinfo("Validation Results", message)
                    self.log(f"Validated {len(valid_numbers)} numbers from {file_path}")
                    
                    if invalid_numbers:
                        self.log(f"Found {len(invalid_numbers)} invalid numbers", "warning")
                else:
                    messagebox.showerror("Validation Failed", "No valid numbers found in the file. Please check the format.")
                    self.log("No valid numbers found in file", "error")
                    
            except Exception as e:
                messagebox.showerror("Error", f"Failed to read numbers file: {str(e)}")
                self.log(f"Error reading numbers file: {str(e)}", "error")
    
    def check_adb_connection(self):
        """Check if ADB is available and get connected devices"""
        try:
            result = subprocess.run(['adb', 'devices'], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')[1:]  # Skip header
                devices = [line.split('\t')[0] for line in lines if '\tdevice' in line]
                return devices
            return []
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return None
    
    def get_device_info(self, device_id):
        """Get device name and model"""
        try:
            # Get device model
            result = subprocess.run(['adb', '-s', device_id, 'shell', 'getprop', 'ro.product.model'], 
                                  capture_output=True, text=True, timeout=5)
            model = result.stdout.strip() if result.returncode == 0 else "Unknown"
            
            # Get device brand
            result = subprocess.run(['adb', '-s', device_id, 'shell', 'getprop', 'ro.product.brand'], 
                                  capture_output=True, text=True, timeout=5)
            brand = result.stdout.strip() if result.returncode == 0 else "Unknown"
            
            return f"{brand} {model}"
        except:
            return "Unknown Device"
    
    def install_dependencies(self):
        """Install required dependencies"""
        try:
            self.log("Installing dependencies...", "info")
            self.update_status("Installing dependencies...")
            
            # Install uiautomator2
            result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'uiautomator2'], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                self.log("Failed to install uiautomator2", "error")
                return False
            
            self.log("Dependencies installed successfully", "info")
            return True
        except Exception as e:
            self.log(f"Error installing dependencies: {str(e)}", "error")
            return False
    
    def download_script(self):
        """Download script from server"""
        try:
            # Get selected script and country IDs
            selected_script = self.script_var.get()
            selected_country = self.country_var.get()
            
            script_id = None
            country_id = None
            
            # Find script ID
            for script in self.scripts_data:
                if script['appName'] == selected_script:
                    script_id = script['id']
                    break
            
            # Find country ID
            for country in self.countries_data:
                if f"{country['name']} (+{country['code']})" == selected_country:
                    country_id = country['id']
                    break
            
            if not script_id or not country_id:
                self.log("Invalid script or country selection", "error")
                return False
            
            # Prepare request data
            request_data = {
                "scriptId": script_id,
                "countryId": country_id,
                "phoneNumbers": self.validated_numbers
            }
            
            self.log("Downloading script from server...", "info")
            
            # Debug: Check session cookies
            self.log(f"Debug: Session cookies: {dict(self.session.cookies)}", "info")
            
            # Test session first with a simple call
            test_response = self.session.get(f"{self.base_url}/api/countries")
            self.log(f"Debug: Test API call status: {test_response.status_code}", "info")
            
            response = self.session.post(f"{self.base_url}/api/scripts/download", json=request_data)
            
            if response.status_code == 200:
                data = response.json()
                script_content = data.get('script')
                self.current_task_id = data.get('taskId')
                
                # Create temp directory
                self.temp_dir = tempfile.mkdtemp(prefix='otp_automation_')
                script_path = os.path.join(self.temp_dir, 'automation_script.py')
                
                # Save script
                with open(script_path, 'w', encoding='utf-8') as f:
                    f.write(script_content)
                
                self.downloaded_script_path = script_path
                self.log("Script downloaded successfully", "info")
                return True
            else:
                self.log(f"Failed to download script: {response.text}", "error")
                return False
                
        except Exception as e:
            self.log(f"Error downloading script: {str(e)}", "error")
            return False
    
    def start_automation(self):
        if not self.numbers_file.get():
            messagebox.showerror("Error", "Please select a numbers file")
            return
        
        script_name = self.script_var.get()
        country = self.country_var.get()
        
        if not script_name or not country:
            messagebox.showerror("Error", "Please select both script and country")
            return
        
        if not self.validated_numbers:
            messagebox.showerror("Error", "No valid numbers found. Please upload and validate a numbers file.")
            return
        
        try:
            self.log(f"Starting automation for {script_name} in {country}")
            self.update_status("Checking device connection...")
            
            # Disable UI during processing
            self.toggle_ui_state(False)
            
            # Step 1: Check for ADB and connected devices
            devices = self.check_adb_connection()
            if devices is None:
                messagebox.showerror("ADB Error", "ADB is not installed or not in PATH. Please install Android SDK Platform Tools.")
                self.toggle_ui_state(True)
                return
            
            if not devices:
                messagebox.showwarning("No Device", "Please connect your Android device and enable USB Debugging.")
                self.toggle_ui_state(True)
                return
            
            # If multiple devices, use the first one (or show selection dialog)
            device_id = devices[0]
            device_info = self.get_device_info(device_id)
            self.connected_device = device_id
            
            self.log(f"✅ Connected to device: {device_info} ({device_id})")
            messagebox.showinfo("Device Connected", f"Connected to: {device_info}")
            
            # Step 2: Install dependencies
            self.update_status("Installing dependencies...")
            if not self.install_dependencies():
                messagebox.showerror("Error", "Failed to install required dependencies")
                self.toggle_ui_state(True)
                return
            
            # Step 3: Download script from server
            self.update_status("Downloading script...")
            if not self.download_script():
                messagebox.showerror("Error", "Failed to download automation script")
                self.toggle_ui_state(True)
                return
            
            # Step 4: Execute script
            self.update_status("Executing automation...")
            self.execute_automation_script()
            
        except Exception as e:
            self.log(f"Error starting automation: {str(e)}", "error")
            self.toggle_ui_state(True)
    
    def execute_automation_script(self):
        """Execute the downloaded automation script"""
        try:
            if not self.downloaded_script_path or not os.path.exists(self.downloaded_script_path):
                self.log("Script file not found", "error")
                return
            
            self.log("Starting script execution...", "info")
            
            # Create automation configuration file
            self.create_automation_config()
            
            # Prepare environment with Unicode support
            env = os.environ.copy()
            env['ANDROID_SERIAL'] = self.connected_device
            env['PYTHONIOENCODING'] = 'utf-8'
            env['PYTHONUTF8'] = '1'
            
            # Start script execution in a separate thread
            def run_script():
                try:
                    self.automation_process = subprocess.Popen(
                        [sys.executable, self.downloaded_script_path],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        text=True,
                        bufsize=1,
                        universal_newlines=True,
                        env=env,
                        cwd=self.temp_dir
                    )
                    
                    # Read output in real-time with proper encoding handling
                    while True:
                        try:
                            output = self.automation_process.stdout.readline()
                            if output == '' and self.automation_process.poll() is not None:
                                break
                            if output:
                                # Schedule log update in main thread
                                self.root.after(0, lambda msg=output.strip(): self.log(msg))
                        except UnicodeDecodeError as e:
                            # Handle Unicode decode errors gracefully
                            error_msg = f"Unicode decode error in script output: {str(e)}"
                            self.root.after(0, lambda: self.log(error_msg, "warning"))
                            continue
                        except Exception as e:
                            error_msg = f"Error reading script output: {str(e)}"
                            self.root.after(0, lambda: self.log(error_msg, "error"))
                            break
                    
                    # Wait for process to complete
                    return_code = self.automation_process.wait()
                    
                    # Report results
                    self.root.after(0, lambda: self.report_automation_results(return_code))
                    
                except Exception as e:
                    self.root.after(0, lambda: self.log(f"Script execution error: {str(e)}", "error"))
                    self.root.after(0, lambda: self.automation_complete(False))
            
            # Start script in background thread
            script_thread = threading.Thread(target=run_script, daemon=True)
            script_thread.start()
            
        except Exception as e:
            self.log(f"Error executing script: {str(e)}", "error")
            self.automation_complete(False)
    
    def create_automation_config(self):
        """Create the automation_config.json file in the temp directory"""
        try:
            selected_country_str = self.country_var.get()
            country_data = None
            for country in self.countries_data:
                if f"{country['name']} (+{country['code']})" == selected_country_str:
                    country_data = country
                    break
            
            if not country_data:
                self.log("Could not find selected country data for config", "error")
                return

            config = {
                "country_code": country_data['code'],
                "country_name": country_data['name'],
                "phone_numbers": self.validated_numbers
            }
            
            config_path = os.path.join(self.temp_dir, "automation_config.json")
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4)
            
            self.log("Automation config file created", "info")
        except Exception as e:
            self.log(f"Error creating automation config: {str(e)}", "error")
    
    def report_automation_results(self, return_code):
        """Report automation results to server"""
        try:
            success = return_code == 0
            otp_count = len(self.validated_numbers) if success else 0
            
            if self.current_task_id:
                # Report to server
                report_data = {
                    "taskId": self.current_task_id,
                    "status": "success" if success else "failed",
                    "otpProcessed": otp_count,
                    "errorMessage": "" if success else "Script execution failed"
                }
                
                response = self.session.post(f"{self.base_url}/api/tasks/report-status", json=report_data)
                if response.status_code == 200:
                    self.log("Results reported to server successfully")
                else:
                    self.log("Failed to report results to server", "warning")
            
            self.automation_complete(success, otp_count)
            
        except Exception as e:
            self.log(f"Error reporting results: {str(e)}", "error")
            self.automation_complete(False)
    
    def automation_complete(self, success, otp_count=0):
        """Handle automation completion"""
        if success:
            self.log(f"✅ Automation completed successfully! Processed {otp_count} numbers")
            self.update_status("Automation completed successfully")
            messagebox.showinfo("Success", f"Automation completed successfully!\nProcessed {otp_count} numbers")
        else:
            self.log("❌ Automation failed", "error")
            self.update_status("Automation failed")
            messagebox.showerror("Failed", "Automation failed. Check logs for details.")
        
        # Cleanup and re-enable UI
        self.cleanup_temp_files()
        self.toggle_ui_state(True)
        self.automation_process = None
    
    def simulate_automation_complete(self):
        self.log("Automation completed successfully!", "info")
        self.update_status("Ready")
        self.toggle_ui_state(True)
        messagebox.showinfo("Success", "Automation completed successfully!")
    
    def toggle_ui_state(self, enabled):
        state = NORMAL if enabled else DISABLED
        self.script_dropdown.config(state=state)
        self.country_dropdown.config(state=state)
        self.start_btn.config(state=state if self.numbers_file.get() else DISABLED)
    
    def cleanup_temp_files(self):
        """Clean up temporary files and directories"""
        try:
            if self.temp_dir and os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                self.log("Temporary files cleaned up")
        except Exception as e:
            self.log(f"Error cleaning up temp files: {str(e)}", "error")
    
    def on_closing(self):
        """Handle application closing"""
        try:
            # Stop any running automation process
            if self.automation_process and self.automation_process.poll() is None:
                self.automation_process.terminate()
                self.log("Automation process terminated")
            
            # Clean up temporary files
            self.cleanup_temp_files()
            
            # Close the application
            self.root.destroy()
        except Exception as e:
            self.log(f"Error during cleanup: {str(e)}", "error")
            self.root.destroy()

if __name__ == "__main__":
    root = Tk()
    app = OTPAutomationApp(root)
    root.mainloop()
