import { useEffect, useRef, useState, useCallback } from 'react';
import {
  supabase,
  hasValidSupabaseConfig,
  type TelemetryRow,
  type IotSensorState,
  defaultIotState,
  telemetryRowToState,
} from '@/lib/supabase';

interface UseTelemetryOptions {
  liveMode: boolean;
  /** Called only on a fatal/config error — reverts the dashboard to simulation mode. */
  onError?: () => void;
}

/**
 * Returns true for errors that indicate a fundamental configuration problem
 * (bad URL, wrong key, table does not exist, RLS blocks all access).
 * Returns false for transient network errors where retrying makes sense.
 */
function isFatalError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('relation') ||          // table does not exist
    lower.includes('permission denied') || // RLS blocking SELECT
    lower.includes('jwt') ||               // bad anon key
    lower.includes('invalid api key') ||   // bad anon key
    lower.includes('unauthorized')         // 401
  );
}

export function useTelemetry({ liveMode, onError }: UseTelemetryOptions) {
  const [iotState, setIotState] = useState<IotSensorState>(defaultIotState);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch the latest telemetry row on mount / when entering live mode.
  // On transient failure: show the error banner but stay in live mode and
  // schedule a retry. On fatal failure: revert to simulation mode.
  const fetchLatest = useCallback(async () => {
    // Guard: do nothing if Supabase is not properly configured
    if (!hasValidSupabaseConfig()) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
      onError?.();
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('iot_telemetry')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        const msg = fetchError.message;
        setError(msg);

        if (isFatalError(msg)) {
          // Config or schema problem — revert to simulation so the dashboard
          // remains functional while the user fixes the issue.
          onError?.();
        } else {
          // Transient problem (network blip, Supabase momentarily unavailable).
          // Stay in live mode and retry after 5 s.
          scheduleRetry();
        }
        return;
      }

      // Success — clear any previous error
      setError(null);
      if (data) {
        setIotState(telemetryRowToState(data as TelemetryRow));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';

      // "Failed to fetch" is a browser-level network error — transient.
      // Do not revert to simulation; show the error and retry.
      const isTransient =
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('timeout');

      setError(msg);

      if (isTransient) {
        scheduleRetry();
      } else {
        onError?.();
      }
    }
  }, [onError]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Schedules a fetchLatest retry after 5 seconds (clears any existing timer). */
  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      fetchLatest();
    }, 5000);
  }, [fetchLatest]);

  useEffect(() => {
    // Tear down everything when leaving live mode
    if (!liveMode) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      return;
    }

    // ── Enter live mode ────────────────────────────────────────────────────
    // 1. Fetch latest row immediately (shows last known PIR state on load)
    fetchLatest();

    // 2. Subscribe to Realtime INSERT events so every new ESP32 POST is
    //    reflected on the dashboard without a page refresh.
    const channel = supabase
      .channel('iot-telemetry-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'iot_telemetry' },
        (payload) => {
          // A new row arrived — update state immediately, clear any error
          setError(null);
          setIotState(telemetryRowToState(payload.new as TelemetryRow));
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Realtime channel failed — show the banner but do NOT revert to
          // simulation mode. The user can still see the last known state and
          // the error message explains what to check.
          setError(
            'Realtime channel error — verify Supabase credentials and that the ' +
            'telemetry table has Realtime enabled in the Supabase Dashboard.'
          );
        }
        if (status === 'SUBSCRIBED') {
          setError(null);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [liveMode, fetchLatest]);

  return { iotState, setIotState, error };
}
