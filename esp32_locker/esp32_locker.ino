/*
 * SherLostHolmes - ESP32 Smart Locker Controller
 * Locker #1 - Hall Building H1 Lobby
 *
 * Hardware:
 * - XIAO ESP32-S3
 * - Servo motor for lock mechanism
 * - CardKB I2C keyboard for code entry
 *
 * Backend Integration:
 * - Fetches password from API on startup and periodically
 * - Reports unlock events to backend
 * - Reports item collection to backend
 */

#include <Arduino.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================

// WiFi Credentials
const char* WIFI_SSID = "Nomin402";           // Change this
const char* WIFI_PASSWORD = "88110412";    // Change this

// Backend API Configuration
const char* API_BASE_URL = "http://192.168.1.100:8000";  // Change to your backend IP
const int LOCKER_NUMBER = 1;

// Hardware Pins
const int SERVO_PIN = 1;           // GPIO 1 (D0) for Servo
const int CARDKB_ADDR = 0x5F;      // I2C address for CardKB

// Servo Positions
const int SERVO_LOCKED = 110;      // Locked position
const int SERVO_UNLOCKED = 10;     // Unlocked position

// Timing
const unsigned long UNLOCK_DURATION = 10000;      // 10 seconds to collect item
const unsigned long PASSWORD_REFRESH = 30000;     // Refresh password every 30 seconds
const unsigned long WIFI_RETRY_DELAY = 10000;     // WiFi retry delay (10 seconds)

// ==================== GLOBAL VARIABLES ====================

Servo myServo;
String inputBuffer = "";
String currentPassword = "";
String currentItemId = "";
String lockerStatus = "unknown";
bool isConnected = false;
unsigned long lastPasswordFetch = 0;
unsigned long unlockStartTime = 0;
bool isUnlocked = false;
bool wifiConnecting = false;
unsigned long lastWifiAttempt = 0;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n");
  Serial.println("========================================");
  Serial.println("   SHERLOSTHOLMES LOCKER SYSTEM");
  Serial.println("   Locker #" + String(LOCKER_NUMBER));
  Serial.println("========================================");

  // Initialize I2C for CardKB
  Wire.begin(5, 6); // XIAO ESP32-S3 I2C pins: SDA=5, SCL=6

  // Initialize Servo
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);

  myServo.setPeriodHertz(50);
  myServo.attach(SERVO_PIN, 500, 2400);

  // Initial State: Locked
  myServo.write(SERVO_LOCKED);
  Serial.println("[SERVO] Locker LOCKED");

  // Connect to WiFi
  connectWiFi();

  // Fetch initial password from backend
  if (isConnected) {
    fetchLockerInfo();
  }

  Serial.println("\n--- SYSTEM READY ---");
  printStatus();
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check WiFi connection status
  if (WiFi.status() == WL_CONNECTED) {
    if (!isConnected) {
      // Just connected
      isConnected = true;
      wifiConnecting = false;
      Serial.println("\n[WIFI] Connected!");
      Serial.print("[WIFI] IP: ");
      Serial.println(WiFi.localIP());
      fetchLockerInfo();
    }
  } else {
    if (isConnected) {
      // Just disconnected
      isConnected = false;
      Serial.println("[WIFI] Connection lost!");
    }
    // Only retry WiFi connection if not already connecting and enough time has passed
    if (!wifiConnecting && (millis() - lastWifiAttempt > WIFI_RETRY_DELAY)) {
      connectWiFi();
    }
  }

  // Periodically refresh password from backend
  if (isConnected && (millis() - lastPasswordFetch > PASSWORD_REFRESH)) {
    fetchLockerInfo();
  }

  // Handle keyboard input
  handleKeyboardInput();

  // Check if unlock duration has expired
  if (isUnlocked && (millis() - unlockStartTime > UNLOCK_DURATION)) {
    lockLocker();
    // Assume item was collected after unlock duration
    reportItemCollected();
  }

  delay(10);
}

// ==================== WIFI FUNCTIONS ====================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    isConnected = true;
    wifiConnecting = false;
    return;
  }

  // Disconnect first to clear any stuck state
  WiFi.disconnect(true);
  delay(100);
  
  WiFi.mode(WIFI_STA);
  delay(100);

  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);

  wifiConnecting = true;
  lastWifiAttempt = millis();
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Wait for connection with timeout (non-blocking style)
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    isConnected = true;
    wifiConnecting = false;
    Serial.println("\n[WIFI] Connected!");
    Serial.print("[WIFI] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    isConnected = false;
    wifiConnecting = false;
    Serial.println("\n[WIFI] Connection failed! Will retry in " + String(WIFI_RETRY_DELAY/1000) + " seconds.");
  }
}

// ==================== API FUNCTIONS ====================

void fetchLockerInfo() {
  if (!isConnected) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/lockers/esp32/" + String(LOCKER_NUMBER);

  Serial.println("[API] Fetching locker info...");

  http.begin(url);
  http.setTimeout(5000);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();

    // Parse JSON response
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      currentPassword = doc["password"].as<String>();
      currentItemId = doc["item_id"].as<String>();
      lockerStatus = doc["status"].as<String>();

      Serial.println("[API] Locker info updated");
      Serial.println("[API] Status: " + lockerStatus);
      Serial.println("[API] Password: " + currentPassword);

      lastPasswordFetch = millis();
    } else {
      Serial.println("[API] JSON parse error: " + String(error.c_str()));
    }
  } else if (httpCode == 404) {
    // Locker not assigned
    currentPassword = "";
    currentItemId = "";
    lockerStatus = "available";
    Serial.println("[API] Locker is available (no item assigned)");
    lastPasswordFetch = millis();
  } else {
    Serial.println("[API] Error: " + String(httpCode));
  }

  http.end();
}

bool verifyPassword(String enteredPassword) {
  if (!isConnected) {
    // Offline mode - use cached password
    return enteredPassword == currentPassword && currentPassword.length() > 0;
  }

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/lockers/esp32/" + String(LOCKER_NUMBER) + "/verify";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  // Create JSON payload
  StaticJsonDocument<128> doc;
  doc["password"] = enteredPassword;
  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);

  bool valid = false;

  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<256> responseDoc;
    deserializeJson(responseDoc, response);
    valid = responseDoc["valid"].as<bool>();
  }

  http.end();
  return valid;
}

void reportUnlock(String password) {
  if (!isConnected) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/lockers/esp32/" + String(LOCKER_NUMBER) + "/unlock";

  Serial.println("[API] Reporting unlock...");

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  StaticJsonDocument<128> doc;
  doc["password"] = password;
  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    Serial.println("[API] Unlock reported successfully");
  } else {
    Serial.println("[API] Unlock report failed: " + String(httpCode));
  }

  http.end();
}

void reportItemCollected() {
  if (!isConnected || currentPassword.length() == 0) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/lockers/esp32/" + String(LOCKER_NUMBER) + "/collected";

  Serial.println("[API] Reporting item collected...");

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  StaticJsonDocument<128> doc;
  doc["password"] = currentPassword;
  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    Serial.println("[API] Item collection reported successfully");
    // Reset locker after collection
    resetLockerAfterCollection();
  } else {
    Serial.println("[API] Collection report failed: " + String(httpCode));
  }

  http.end();
}

void resetLockerAfterCollection() {
  if (!isConnected) return;

  HTTPClient http;
  String url = String(API_BASE_URL) + "/api/lockers/esp32/" + String(LOCKER_NUMBER) + "/reset";

  Serial.println("[API] Resetting locker...");

  http.begin(url);
  http.setTimeout(5000);

  int httpCode = http.POST("");

  if (httpCode == 200) {
    Serial.println("[API] Locker reset successfully");
    currentPassword = "";
    currentItemId = "";
    lockerStatus = "available";
  }

  http.end();
}

// ==================== KEYBOARD FUNCTIONS ====================

void handleKeyboardInput() {
  Wire.requestFrom(CARDKB_ADDR, 1);

  while (Wire.available()) {
    char c = Wire.read();

    if (c != 0) {
      if (c == 0x0D) { // Enter key
        processCode();
      }
      else if (c == 0x08) { // Backspace
        if (inputBuffer.length() > 0) {
          inputBuffer.remove(inputBuffer.length() - 1);
          Serial.println("\n[INPUT] " + getMaskedInput());
        }
      }
      else if (c >= '0' && c <= '9') { // Only accept digits
        inputBuffer += c;
        Serial.print("*");
      }
    }
  }
}

void processCode() {
  Serial.println();

  if (inputBuffer.length() == 0) {
    Serial.println("[ERROR] No code entered");
    printPrompt();
    return;
  }

  Serial.println("[CHECK] Verifying code...");

  // Check if locker has an assigned item
  if (lockerStatus == "available" || currentPassword.length() == 0) {
    Serial.println("[ERROR] No item assigned to this locker");
    inputBuffer = "";
    printPrompt();
    return;
  }

  // Verify the password
  bool valid = false;

  if (isConnected) {
    valid = verifyPassword(inputBuffer);
  } else {
    // Offline verification
    valid = (inputBuffer == currentPassword);
  }

  if (valid) {
    Serial.println("\n========================================");
    Serial.println("   >>> ACCESS GRANTED <<<");
    Serial.println("========================================");
    Serial.println("[ACTION] Unlocking...");

    // Report unlock to backend
    reportUnlock(inputBuffer);

    // Unlock the servo
    unlockLocker();

    Serial.println("[INFO] Please collect your item");
    Serial.println("[INFO] Locker will auto-lock in " + String(UNLOCK_DURATION/1000) + " seconds");

  } else {
    Serial.println("\n========================================");
    Serial.println("   >>> ACCESS DENIED <<<");
    Serial.println("========================================");
    Serial.println("[ERROR] Invalid code. Try again.");
  }

  inputBuffer = "";

  if (!isUnlocked) {
    printPrompt();
  }
}

// ==================== SERVO FUNCTIONS ====================

void unlockLocker() {
  myServo.write(SERVO_UNLOCKED);
  isUnlocked = true;
  unlockStartTime = millis();
  Serial.println("[SERVO] Locker UNLOCKED");
}

void lockLocker() {
  myServo.write(SERVO_LOCKED);
  isUnlocked = false;
  Serial.println("[SERVO] Locker LOCKED");
  printPrompt();
}

// ==================== UTILITY FUNCTIONS ====================

String getMaskedInput() {
  String masked = "";
  for (unsigned int i = 0; i < inputBuffer.length(); i++) {
    masked += "*";
  }
  return masked;
}

void printStatus() {
  Serial.println("\n--- LOCKER STATUS ---");
  Serial.println("Locker #: " + String(LOCKER_NUMBER));
  Serial.println("WiFi: " + String(isConnected ? "Connected" : "Disconnected"));
  Serial.println("Status: " + lockerStatus);
  Serial.println("Item Assigned: " + String(currentPassword.length() > 0 ? "Yes" : "No"));
  Serial.println("---------------------");
}

void printPrompt() {
  Serial.println("\nEnter 4-digit code:");
}
