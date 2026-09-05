import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, type TelemetryRow, type IotSensorState, defaultIotState, telemetryRowToState } from '@/lib/supabase';

interface UseTelemetryOptions {
  liveMode: boolean;
  onError?: () => void;
}

export function useTelemetry({ liveMode, onError }: UseTelemetryOptions) {
  const [iotState, setIotState] = useState<IotSensorState>(defaultIotState);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch latest telemetry row on mount / when entering live mode
  const fetchLatest = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('iot_telemetry')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        onError?.();
        return;
      }
      if (data) {
        setIotState(telemetryRowToState(data as TelemetryRow));
      }
    } catch (err: any) {
      setError(err?.message || 'Connection failed');
      onError?.();
    }
  }, [onError]);

  useEffect(() => {
    if (!liveMode) {
      // Clean up realtime channel when leaving live mode
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Enter live mode: fetch latest + subscribe to new inserts
    fetchLatest();

    const channel = supabase
      .channel('iot-telemetry-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'iot_telemetry' },
        (payload) => {
          setIotState(telemetryRowToState(payload.new as TelemetryRow));
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError?.();
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [liveMode, fetchLatest, onError]);

  return { iotState, setIotState, error };
}
