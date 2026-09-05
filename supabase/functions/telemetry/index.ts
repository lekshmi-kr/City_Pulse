import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST to send telemetry." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();

    // Validate and extract fields from ESP32 payload
    // Expected: { pir_detected: true, temp: 28.5, humidity: 75, node_id?: "esp32-node-01" }
    const pir_detected =
      typeof body.pir_detected === "boolean" ? body.pir_detected : false;
    const temp =
      typeof body.temp === "number" && body.temp > -50 && body.temp < 100
        ? body.temp
        : null;
    const humidity =
      typeof body.humidity === "number" && body.humidity >= 0 && body.humidity <= 100
        ? body.humidity
        : null;
    const node_id =
      typeof body.node_id === "string" ? body.node_id : "esp32-node-01";

    // Derive LED and buzzer state from sensor data
    // If PIR detects motion + high humidity → red LED + buzzer alert
    const isAlert = pir_detected && (humidity !== null ? humidity > 80 : false);
    const led_state = isAlert ? "red" : "green";
    const buzzer_active = isAlert;

    // Derive LCD text from current conditions
    let lcd_text = "Showing: City Health Score";
    if (isAlert) {
      lcd_text = "ALERT: High crowd + humidity";
    } else if (pir_detected) {
      lcd_text = "Crowd activity detected";
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("iot_telemetry")
      .insert({
        pir_detected,
        temp,
        humidity,
        lcd_text,
        led_state,
        buzzer_active,
        node_id,
      })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Telemetry received",
        data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
