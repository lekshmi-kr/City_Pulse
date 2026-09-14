-- Enable Supabase Realtime for incoming ESP32 telemetry rows.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'iot_telemetry'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_telemetry;
  END IF;
END
$$;
