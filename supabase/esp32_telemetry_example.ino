/*
  ESP32 PIR Telemetry — Supabase REST API Reference Sketch
  =========================================================
  Hardware:
    - ESP32 (any variant)
    - PIR motion sensor: OUT pin → GPIO 13 (D13)
    - LCD, LED, Buzzer handled locally by this sketch (not sent to Supabase)

  Data flow:
    PIR OUT → D13 → ESP32 reads HIGH/LOW → POST /rest/v1/telemetry → Supabase
    Supabase Realtime → React dashboard updates instantly

  What is sent to Supabase:
    POST https://<project>.supabase.co/rest/v1/telemetry
    Content-Type: application/json
    apikey: <ANON_KEY>
    Authorization: Bearer <ANON_KEY>
    Body: {"pir_detected": true}   or   {"pir_detected": false}

  NOTE: Do NOT use the service_role key here. The anon key is sufficient
        because the RLS policy allows anon INSERT on the telemetry table.
        The created_at timestamp is set automatically by the database.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── WiFi credentials ──────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ── Supabase configuration ────────────────────────────────────────────────────
// Replace <ANON_KEY> with your project's anon/public key.
// Find it at: Supabase Dashboard → Project Settings → API → Project API keys → anon public
// NEVER use the service_role key here.
const char* SUPABASE_URL  = "https://ilyfbrwlbcfnzowvnaec.supabase.co";
const char* SUPABASE_ANON_KEY = "<PASTE_YOUR_ANON_KEY_HERE>";

// ── Pin assignments ───────────────────────────────────────────────────────────
const int PIR_PIN     = 13;   // PIR OUT → D13
// LCD, LED, Buzzer are wired separately and handled locally below.
// Do not change these GPIO assignments.

// ── Telemetry interval ────────────────────────────────────────────────────────
// Send a telemetry update to Supabase whenever the PIR state changes,
// and also every HEARTBEAT_MS milliseconds as a keep-alive.
const unsigned long HEARTBEAT_MS = 10000;  // 10 seconds

// ── State ─────────────────────────────────────────────────────────────────────
bool lastPirState      = false;
unsigned long lastSend = 0;

// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);

  // Connect to WiFi
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nConnected. IP: %s\n", WiFi.localIP().toString().c_str());
}

// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  bool pirDetected = digitalRead(PIR_PIN) == HIGH;

  // Send on state change OR heartbeat interval
  bool stateChanged = (pirDetected != lastPirState);
  bool heartbeatDue = (millis() - lastSend >= HEARTBEAT_MS);

  if (stateChanged || heartbeatDue) {
    sendTelemetry(pirDetected);
    lastPirState = pirDetected;
    lastSend     = millis();
  }

  // ── Local hardware handling (LCD / LED / Buzzer) ──────────────────────────
  // These are handled here on-device. The Supabase table only receives
  // pir_detected — the dashboard derives led/buzzer state from that.
  // Add your LCD, LED, and Buzzer logic below as needed.
  // e.g.:
  //   digitalWrite(LED_PIN, pirDetected ? HIGH : LOW);
  //   lcd.print(pirDetected ? "MOTION DETECTED" : "Status: Normal");

  delay(200);
}

// ─────────────────────────────────────────────────────────────────────────────
bool sendTelemetry(bool pirDetected) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Telemetry] WiFi not connected — skipping send.");
    return false;
  }

  // Build the JSON payload: {"pir_detected": true/false}
  StaticJsonDocument<64> doc;
  doc["pir_detected"] = pirDetected;
  String payload;
  serializeJson(doc, payload);

  // Build the PostgREST URL
  String url = String(SUPABASE_URL) + "/rest/v1/telemetry";

  HTTPClient http;
  http.begin(url);

  // Required headers for Supabase PostgREST with anon key
  http.addHeader("Content-Type",  "application/json");
  http.addHeader("apikey",        SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  // Prefer: return=minimal tells PostgREST not to echo back the row (saves bandwidth)
  http.addHeader("Prefer", "return=minimal");

  int httpCode = http.POST(payload);

  if (httpCode == 201 || httpCode == 200) {
    Serial.printf("[Telemetry] OK (%d) — pir_detected=%s\n",
                  httpCode, pirDetected ? "true" : "false");
    http.end();
    return true;
  } else {
    Serial.printf("[Telemetry] FAILED (%d): %s\n",
                  httpCode, http.getString().c_str());
    http.end();
    return false;
  }
}
