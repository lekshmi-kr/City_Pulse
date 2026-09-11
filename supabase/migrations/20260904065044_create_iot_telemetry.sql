/*
# Create iot_telemetry table for ESP32 sensor data ingestion

1. Purpose
- Stores telemetry payloads sent by the physical ESP32 microcontroller node
  over Wi-Fi via POST to the telemetry edge function.
- Each row represents a single sensor reading from the ESP32.

2. New Tables
- `iot_telemetry`
  - `id` (uuid, primary key, auto-generated)
  - `pir_detected` (boolean, whether the PIR motion sensor detected pedestrian movement)
  - `temp` (numeric, temperature in °C from the DHT11 sensor)
  - `humidity` (numeric, humidity percentage from the DHT11 sensor)
  - `lcd_text` (text, what is currently displayed on the LCD; defaults to "Showing: City Health Score")
  - `led_state` (text, LED indicator color: "green" or "red")
  - `buzzer_active` (boolean, whether the buzzer alert is currently sounding)
  - `node_id` (text, identifier for which ESP32 node sent the data; defaults to "esp32-node-01")
  - `created_at` (timestamptz, when the reading was received; defaults to now())

3. Security
- Enable RLS on `iot_telemetry`.
- This is a no-auth public dashboard app, so anon + authenticated roles can read and insert.
- Update and delete are also open to anon + authenticated since this is a single-tenant educational demo.

4. Important Notes
- The ESP32 sends JSON payloads like {pir_detected: true, temp: 28.5, humidity: 75}.
- The edge function validates and inserts these into this table.
- The frontend subscribes to new rows via Supabase realtime to update the dashboard live.
- All sensor fields except node_id are nullable so partial payloads still work.
*/

CREATE TABLE IF NOT EXISTS iot_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pir_detected boolean DEFAULT false,
  temp numeric(5, 2),
  humidity numeric(5, 2),
  lcd_text text DEFAULT 'Showing: City Health Score',
  led_state text DEFAULT 'green',
  buzzer_active boolean DEFAULT false,
  node_id text DEFAULT 'esp32-node-01',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE iot_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_telemetry" ON iot_telemetry;
CREATE POLICY "anon_select_telemetry" ON iot_telemetry FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_telemetry" ON iot_telemetry;
CREATE POLICY "anon_insert_telemetry" ON iot_telemetry FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_telemetry" ON iot_telemetry;
CREATE POLICY "anon_update_telemetry" ON iot_telemetry FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_telemetry" ON iot_telemetry;
CREATE POLICY "anon_delete_telemetry" ON iot_telemetry FOR DELETE
  TO anon, authenticated USING (true);

-- Index for efficient realtime queries (latest first)
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_created_at ON iot_telemetry (created_at DESC);
