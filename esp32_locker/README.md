# SherLostHolmes ESP32 Smart Locker

This folder contains the Arduino code for the ESP32-based smart locker system that integrates with the SherLostHolmes backend.

## Hardware Requirements

- **XIAO ESP32-S3** (or compatible ESP32 board)
- **Servo Motor** (for lock mechanism)
- **CardKB I2C Keyboard** (for code entry)
- **Power Supply** (5V for servo, 3.3V for ESP32)

## Wiring

| Component | ESP32 Pin |
|-----------|-----------|
| Servo Signal | GPIO 1 (D0) |
| Servo VCC | 5V |
| Servo GND | GND |
| CardKB SDA | GPIO 5 |
| CardKB SCL | GPIO 6 |
| CardKB VCC | 3.3V |
| CardKB GND | GND |

## Configuration

Before uploading, edit these values in `esp32_locker.ino`:

```cpp
// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";           // Your WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // Your WiFi password

// Backend API Configuration
const char* API_BASE_URL = "http://192.168.1.100:8000";  // Your backend server IP
const int LOCKER_NUMBER = 1;  // This locker's number (1-10)
```

## Required Libraries

Install these libraries via Arduino Library Manager:

1. **ESP32Servo** - For servo control
2. **ArduinoJson** - For JSON parsing (version 6.x)
3. **WiFi** - Built into ESP32 Arduino core
4. **HTTPClient** - Built into ESP32 Arduino core

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/lockers/esp32/{locker_number}` | GET | Fetch assigned item and password |
| `/api/lockers/esp32/{locker_number}/verify` | POST | Verify entered password |
| `/api/lockers/esp32/{locker_number}/unlock` | POST | Report locker unlock event |
| `/api/lockers/esp32/{locker_number}/collected` | POST | Report item collection |
| `/api/lockers/esp32/{locker_number}/reset` | POST | Reset locker to available |

## Operation Flow

1. **Startup**: ESP32 connects to WiFi and fetches locker status from backend
2. **Idle**: Displays prompt for code entry, refreshes password every 30 seconds
3. **Code Entry**: User enters 4-digit code on CardKB
4. **Verification**: Code is verified against backend API
5. **Unlock**: If valid, servo unlocks and backend is notified
6. **Collection**: After 10 seconds, locker auto-locks and reports collection
7. **Reset**: Backend marks item as collected and locker becomes available

## LED Status (if available)

You can add an LED for visual feedback:
- Blinking: Waiting for code
- Solid Green: Access granted
- Solid Red: Access denied

## Troubleshooting

### WiFi Connection Issues
- Check SSID and password are correct
- Ensure ESP32 is within WiFi range
- Backend server must be accessible from the same network

### Servo Not Moving
- Check wiring connections
- Verify 5V power supply for servo
- Test with a simple servo sweep sketch first

### CardKB Not Responding
- Verify I2C address (default 0x5F)
- Check SDA/SCL wiring
- Run I2C scanner to detect the device

### API Connection Failed
- Verify backend server is running
- Check firewall settings allow connections on port 8000
- Test API endpoints with curl or browser first

## Serial Monitor Output

Connect at 115200 baud to see debug output:

```
========================================
   SHERLOSTHOLMES LOCKER SYSTEM
   Locker #1
========================================
[WIFI] Connecting to MyNetwork
[WIFI] Connected!
[WIFI] IP: 192.168.1.50
[API] Fetching locker info...
[API] Locker info updated
[API] Status: assigned
[API] Password: 1234

--- SYSTEM READY ---

Enter 4-digit code:
****
[CHECK] Verifying code...

========================================
   >>> ACCESS GRANTED <<<
========================================
[ACTION] Unlocking...
[API] Unlock reported successfully
[SERVO] Locker UNLOCKED
[INFO] Please collect your item
[INFO] Locker will auto-lock in 10 seconds
```
