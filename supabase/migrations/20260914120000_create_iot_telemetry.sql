/*
  # Create public.iot_telemetry table for ESP32 Ultrasonic + DHT11 telemetry

  ## Purpose
  This table stores real ESP32 hardware telemetry from:
    - HC-SR04 Ultrasonic sensor (object detection + distance)
    - DHT11 sensor (temperature + humidity)

  The ESP32 sends a JSON payload via Supabase PostgREST:

      POST /rest/v1/iot_telemetry
      Content-Type: application/json
      apikey: <anon key>
      Authorization: Bearer <anon key>

      {
        "pir_detected": true,
        "distance": 12.50,
        "temp": 25.20,
        "humidity": 63.40
      }

  ## Schema
  - id           uuid        PK, auto-generated
  - pir_detected boolean     true = object closer than DETECT_CM threshold
  - distance     float8      measured distance in cm (-1 = out of range)
  - temp         float8      DHT11 temperature in C
  - humidity     float8      DHT11 humidity in %
  - created_at   timestamptz auto-stamped by Postgres on INSERT

  ## Security (RLS)
  - anon role can INSERT  -> ESP32 uses the public anon key
  - anon role can SELECT  -> React dashboard reads rows with the same anon key

  ## Realtime
  Table is added to supabase_realtime publication so postgres_changes
  subscriptions on this table fire on every INSERT.
*/

-- Table
CREATE TABLE IF NOT EXISTS public.iot_telemetry (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pir_detected boolean     NOT NULL DEFAULT false,
  distance     float8,
  temp         float8,
  humidity     float8,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.iot_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_iot_telemetry" ON public.iot_telemetry;
CREATE POLICY "anon_insert_iot_telemetry"
  ON public.iot_telemetry
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_iot_telemetry" ON public.iot_telemetry;
CREATE POLICY "anon_select_iot_telemetry"
  ON public.iot_telemetry
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_telemetry;

-- Index
CREATE INDEX IF NOT EXISTS idx_iot_telemetry_created_at
  ON public.iot_telemetry (created_at DESC);
