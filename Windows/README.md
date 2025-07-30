# Secure OTP Automation - Desktop Client

This is the desktop client application for the Secure OTP Automation Platform. It provides a user-friendly interface for executing OTP automation tasks on Android devices.

## Features

- Secure login with JWT authentication
- MAC address binding for security
- Script selection from available automation scripts
- Country code selection with phone number validation
- File upload for phone numbers
- Real-time logging of automation process
- Secure script execution with temporary file handling

## Prerequisites

- Python 3.8 or higher
- ADB (Android Debug Bridge) installed and configured
- Android device with USB debugging enabled
- Active internet connection for API communication

## Installation

1. Clone the repository or download the source code
2. Navigate to the Windows directory:
   ```
   cd OtpGuard/Windows
   ```
3. Create a virtual environment (recommended):
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
4. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Configuration

1. Update the `base_url` in `main.py` to point to your backend API server
2. Ensure your Android device is connected via USB with USB debugging enabled
3. Run the application:
   ```
   python main.py
   ```

## Usage

1. **Login**
   - Enter your email and password
   - The application will automatically detect and register your MAC address on first login

2. **Select Script**
   - Choose an automation script from the dropdown menu
   - Select the target country for phone number validation

3. **Upload Numbers**
   - Click "Upload numbers.txt" and select a text file containing phone numbers
   - Each number should be on a new line

4. **Start Automation**
   - Click "Start Automation" to begin the process
   - Monitor the logs in real-time
   - The application will automatically clean up temporary files when done

## Building an Executable

To create a standalone executable:

```
pip install pyinstaller
pyinstaller --onefile --windowed --icon=icon.ico main.py
```

The executable will be created in the `dist` directory.

## Security Notes

- The application stores your login token locally in `config.json`
- Your MAC address is used for device binding and cannot be changed after registration
- Temporary script files are automatically deleted after execution
- All API communications are encrypted (HTTPS)

## Troubleshooting

- **ADB not found**: Ensure ADB is installed and added to your system PATH
- **Device not detected**: Check USB connection and enable USB debugging on your Android device
- **Login issues**: Verify your credentials and internet connection
- **Script errors**: Check the logs for detailed error messages

## Support

For support or feature requests, please contact your system administrator.

---

© 2025 Secure OTP Automation Platform
