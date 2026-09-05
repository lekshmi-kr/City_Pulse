import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function hasValidSupabaseConfig(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url === 'https://placeholder.supabase.co' || url.includes('placeholder')) return false;
  if (key === 'placeholder' || key.includes('placeholder')) return false;
  return true;
}

export interface TelemetryRow {
  id: string;
  pir_detected: boolean;
  temp: number | null;
  humidity: number | null;
  lcd_text: string;
  led_state: string;
  buzzer_active: boolean;
  node_id: string;
  created_at: string;
}

export interface IotSensorState {
  connected: boolean;
  pirDetected: boolean;
  temperature: number | null;
  humidity: number | null;
  lcdText: string;
  ledState: 'green' | 'red';
  buzzerActive: boolean;
  nodeId: string;
  lastUpdated: string | null;
}

export const defaultIotState: IotSensorState = {
  connected: false,
  pirDetected: false,
  temperature: null,
  humidity: null,
  lcdText: 'Showing: City Health Score',
  ledState: 'green',
  buzzerActive: false,
  nodeId: 'esp32-node-01',
  lastUpdated: null,
};

export function telemetryRowToState(row: TelemetryRow): IotSensorState {
  return {
    connected: true,
    pirDetected: row.pir_detected,
    temperature: row.temp,
    humidity: row.humidity,
    lcdText: row.lcd_text,
    ledState: (row.led_state as 'green' | 'red') ?? 'green',
    buzzerActive: row.buzzer_active,
    nodeId: row.node_id,
    lastUpdated: row.created_at,
  };
}
